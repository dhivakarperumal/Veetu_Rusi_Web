import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaThLarge, 
  FaList, 
  FaSearch, 
  FaTimes,
  FaImage,
  FaFileAlt
} from "react-icons/fa";

const HomeChefCategories = () => {
  const [category, setCategory] = useState({
    CatId: "",
    c_name: "",
    discripti: "",
    image: [],
    subcategory: [],
    category_type: "Food"
  });

  const [editId, setEditId] = useState(null);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [subcatInput, setSubcatInput] = useState("");
  const itemsPerPage = 8;

  const generateCategoryId = (existingCategories) => {
    if (!existingCategories || existingCategories.length === 0) return "HC_CAT001";
    
    const ids = existingCategories
      .map((cat) => {
        if (!cat.CatId) return 0;
        const match = cat.CatId.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter((id) => !isNaN(id));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `HC_CAT${String(maxId + 1).padStart(3, "0")}`;
  };

  const safeParse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/home-chef-categories");
      const sanitized = (response.data || []).map(cat => ({
        ...cat,
        image: safeParse(cat.image),
        subcategory: safeParse(cat.subcategory)
      }));
      setCategories(sanitized);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to fetch categories.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressedFiles = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        )
      );

      const base64Images = await Promise.all(
        compressedFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      setCategory((prev) => ({ ...prev, image: base64Images }));
      setPreviewImgs(base64Images);
      toast.success("Images ready!");
    } catch (error) {
      toast.error("Image processing failed.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  };

  const addSubcategory = () => {
    if (subcatInput.trim() !== '') {
      setCategory(prev => ({ ...prev, subcategory: [...prev.subcategory, subcatInput.trim()] }));
      setSubcatInput("");
    }
  };

  const handleAddSubcategory = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubcategory();
    }
  };

  const removeSubcategory = (index) => {
    setCategory(prev => ({
      ...prev,
      subcategory: prev.subcategory.filter((_, i) => i !== index)
    }));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setCategory({ CatId: "", c_name: "", discripti: "", image: [], subcategory: [], category_type: "Food" });
    setPreviewImgs([]);
    setSubcatInput("");
  };

  const openAddModal = () => {
    const nextId = generateCategoryId(categories);
    setCategory({ CatId: nextId, c_name: "", discripti: "", image: [], subcategory: [], category_type: "Food" });
    setPreviewImgs([]);
    setSubcatInput("");
    setEditId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category.c_name || !category.discripti || category.image.length === 0) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/home-chef-categories/${editId}`, category);
        toast.success("Category updated!");
      } else {
        await api.post("/home-chef-categories", category);
        toast.success("Category added!");
      }
      closeModal();
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category.");
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setCategory({
      CatId: cat.CatId,
      c_name: cat.c_name || "",
      discripti: cat.discripti || "",
      image: cat.image || [],
      subcategory: cat.subcategory || [],
      category_type: cat.category_type || "Food"
    });
    setPreviewImgs(cat.image || []);
    setEditId(cat.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/home-chef-categories/${id}`);
      toast.success("Deleted.");
      await fetchCategories();
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const filteredCategories = categories.filter(cat => {
    const name = (cat.c_name || "").toLowerCase();
    const id = (cat.CatId || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const currentItems = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto mt-0">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
           <div className="relative mb-8 max-w-md">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-bold text-sm text-black"
          />
        </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                <button 
                  onClick={() => setViewMode("card")}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-600'}`}
                >
                  <FaThLarge size={18} />
                </button>
                <button 
                  onClick={() => setViewMode("table")}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-600'}`}
                >
                  <FaList size={18} />
                </button>
             </div>
             
             <button
               onClick={openAddModal}
               className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest"
             >
               <FaPlus /> Add New Category
             </button>
          </div>
        </div>

        {/* Content Section */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map((cat) => (
              <div key={cat.id} className="group bg-white rounded-[2.5rem] p-5 shadow-sm border border-gray-100/50 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 flex flex-col relative overflow-hidden">
                <div className="relative h-48 mb-5 overflow-hidden rounded-[2rem] bg-gray-50 flex items-center justify-center">
                   {cat.image?.[0] ? (
                      <img src={cat.image[0]} alt={cat.c_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   ) : (
                      <FaImage size={40} className="text-gray-200" />
                   )}
                   <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-black text-emerald-900 border border-emerald-100 uppercase tracking-tighter">
                         {cat.CatId}
                      </span>
                   </div>
                   <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                         {cat.category_type}
                      </span>
                   </div>
                </div>

                <div className="px-2 pb-2">
                   <h4 className="text-lg font-black text-slate-950 mb-2 truncate">{cat.c_name}</h4>
                   <p className="text-[11px] text-slate-800 font-bold line-clamp-2 leading-relaxed h-8 mb-4">
                      {cat.discripti}
                   </p>
                   
                   <div className="mb-4 flex flex-wrap gap-1">
                      {(cat.subcategory || []).slice(0,3).map((sub, idx) => (
                         <span key={idx} className="bg-gray-100 text-gray-600 text-[9px] px-2 py-1 rounded font-bold uppercase">{sub}</span>
                      ))}
                      {(cat.subcategory || []).length > 3 && (
                         <span className="bg-gray-100 text-gray-600 text-[9px] px-2 py-1 rounded font-bold uppercase">+{cat.subcategory.length - 3}</span>
                      )}
                   </div>

                   <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                      <div className="flex -space-x-3 overflow-hidden">
                        {(cat.image || []).slice(0, 3).map((img, i) => (
                          <img key={i} src={img} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" alt="" />
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(cat)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                          <FaTrash size={14} />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-[#009669] border-b border-emerald-700">
                   <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest">S.No</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest">ID</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest">Type</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest">Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest">Description</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest text-center">Gallery</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {currentItems.map((cat, index) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-8 py-6 font-black text-slate-900 text-xs text-center">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                         </td>
                         <td className="px-8 py-6 font-black text-slate-900 text-xs">#{cat.CatId}</td>
                         <td className="px-8 py-6 font-black text-emerald-600 text-xs">{cat.category_type}</td>
                         <td className="px-8 py-6">
                            <span className="font-black text-slate-800 text-sm">{cat.c_name}</span>
                         </td>
                         <td className="px-8 py-6 max-w-xs">
                            <p className="text-xs text-gray-500 font-medium truncate italic">"{cat.discripti}"</p>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <div className="flex items-center justify-center -space-x-2">
                               {(cat.image || []).map((img, i) => (
                                 <img key={i} src={img} className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm object-cover" alt="" />
                               ))}
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(cat)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                 <FaEdit size={14} />
                               </button>
                               <button onClick={() => handleDelete(cat.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                 <FaTrash size={14} />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10 mb-10">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 disabled:opacity-30 hover:text-emerald-600 transition-all shadow-sm"
            >
              ←
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100 hover:border-emerald-200'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 disabled:opacity-30 hover:text-emerald-600 transition-all shadow-sm"
            >
              →
            </button>
          </div>
        )}

        {/* Modal Overlay */}
        {showModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
             
             <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-[10000] overflow-hidden max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                {/* Modal Header */}
                <div className="bg-emerald-600 p-8 text-white relative">
                   <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                   <div className="relative flex items-center justify-between">
                      <div>
                         <h3 className="text-2xl font-[900] tracking-tight uppercase">{editId ? 'Update Category' : 'Create Category'}</h3>
                         <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1">Configure your product classification</p>
                      </div>
                      <button type="button" onClick={closeModal} className="p-3 bg-black/10 hover:bg-black/20 rounded-2xl transition-all">
                        <FaTimes size={18} />
                      </button>
                   </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Category Type *</label>
                         <select
                           name="category_type"
                           value={category.category_type}
                           onChange={handleChange}
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all font-black text-black text-sm"
                         >
                           <option value="Food">Food</option>
                           <option value="food products">Food Products</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Auto-Generated ID</label>
                         <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3.5 text-emerald-950 font-black text-sm shadow-inner flex items-center gap-3">
                            <FaFileAlt className="opacity-60" /> {category.CatId}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Category Name *</label>
                      <input
                        type="text"
                        name="c_name"
                        value={category.c_name}
                        onChange={handleChange}
                        placeholder="Enter name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all font-black text-black text-sm"
                        required
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Detailed Description *</label>
                      <textarea
                        name="discripti"
                        value={category.discripti}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Description..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-emerald-600 transition-all font-black text-black text-sm resize-none"
                        required
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Subcategories</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subcatInput}
                          onChange={(e) => setSubcatInput(e.target.value)}
                          onKeyDown={handleAddSubcategory}
                          placeholder="Type subcategory and press Enter or +"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all font-black text-black text-sm"
                        />
                        <button
                          type="button"
                          onClick={addSubcategory}
                          className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center font-bold"
                        >
                          <FaPlus size={18} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                         {category.subcategory.map((sub, idx) => (
                           <div key={idx} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                             {sub}
                             <button type="button" onClick={() => removeSubcategory(idx)} className="text-emerald-600 hover:text-emerald-900"><FaTimes /></button>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Images *</label>
                      <div className="relative group cursor-pointer">
                         <input
                           type="file"
                           accept="image/*"
                           multiple
                           onChange={handleImageChange}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                           required={!editId && category.image.length === 0}
                         />
                         <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl p-8 flex flex-col items-center justify-center transition-all group-hover:bg-emerald-100/50 group-hover:border-emerald-400">
                            <FaImage className="text-emerald-500 mb-3" size={32} />
                            <p className="text-xs font-black text-emerald-950 uppercase tracking-widest">Drop images here or click to upload</p>
                            <p className="text-[9px] text-emerald-600 mt-1 uppercase font-bold opacity-60">High quality images recommended</p>
                         </div>
                      </div>

                      {previewImgs.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                           {previewImgs.map((img, index) => (
                             <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-100 shadow-sm animate-in zoom-in-75">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-[900] py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                      >
                        {loading ? 'Processing Registry...' : (editId ? 'Commit Update' : 'Generate Category')}
                      </button>
                   </div>
                </form>
             </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default HomeChefCategories;
