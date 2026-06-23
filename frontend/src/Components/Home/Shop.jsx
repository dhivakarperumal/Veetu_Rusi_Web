import React, { useContext, useEffect, useState } from "react";
import api from "../../api";
import ProductCard from "../Products/ProductsCard";
import PageHeader from "../CommenComponents/PageHeader";
import { FiFilter, FiX, FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { BsGrid3X3Gap, BsGridFill, BsGrid1X2, BsGrid3X2 } from "react-icons/bs";
import { StoreContext } from "../../PrivateRouter/StoreContext";

const Shop = ({ defaultCategory = "" }) => {
  const { productsCache, setProductsCache, lastFetchTime, setLastFetchTime } =
    useContext(StoreContext);

  const [products, setProducts] = useState(
    Array.isArray(productsCache) ? productsCache : [],
  );
  const [filteredProducts, setFilteredProducts] = useState(
    Array.isArray(productsCache) ? productsCache : [],
  );
  const [loading, setLoading] = useState(
    !productsCache || productsCache.length === 0,
  );

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(defaultCategory ? true : false);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [priceRange, setPriceRange] = useState(10000);
  const [offerFilter, setOfferFilter] = useState(0);
  const [sortOption, setSortOption] = useState("");
  const [homeChef, setHomeChef] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [gridView, setGridView] = useState(5);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setHomeChef(res.data.homeChef);
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Profile load error:", err);
      }
    };
    loadProfile();
  }, []);

  /* ─── Fetch Products ─────────────────────────────────────────── */
  const fetchProducts = async () => {
    // Use cache if fresh (5 min)
    const isCacheValid = lastFetchTime && Date.now() - lastFetchTime < 5 * 60 * 1000;
    if (isCacheValid && productsCache?.length > 0) {
      // Only show active foods for shop
      let myProducts = productsCache.filter(p => p.status?.toLowerCase() === 'active');
      setProducts(myProducts);
      setFilteredProducts(myProducts);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/chef-foods");
      const data = Array.isArray(res.data) ? res.data : [];
      setProductsCache(data);
      setLastFetchTime(Date.now());
      
      // Only show active foods for shop
      let myProducts = data.filter(p => p.status?.toLowerCase() === 'active');
      
      setProducts(myProducts);
      setFilteredProducts(myProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ─── Filter Logic ───────────────────────────────────────────── */
  useEffect(() => {
    let updated = [...products];

    products.forEach((p) => {
      console.log("product category:", p.category);
    });

    if (search) {
      updated = updated.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (selectedCategory) {
      updated = updated.filter(
        (p) =>
          p.category?.trim().toLowerCase() ===
          decodeURIComponent(selectedCategory).trim().toLowerCase()
      );
    }

    if (selectedSubCategory) {
      updated = updated.filter((p) => p.subcategory === selectedSubCategory);
    }

    if (selectedColor) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.colorName === selectedColor),
      );
    }

    if (selectedSize) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.selectedSizes?.includes(selectedSize)),
      );
    }

    // Safe price filter — treat null/undefined as 0
    updated = updated.filter(
      (p) => parseFloat(p.final_price || p.offer_price || p.mrp || 0) <= parseFloat(priceRange),
    );

    if (offerFilter) {
      updated = updated.filter((p) => parseFloat(p.offer || 0) >= offerFilter);
    }

    /* Sorting */
    if (sortOption === "az") updated.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortOption === "za") updated.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (sortOption === "priceLowHigh") updated.sort((a, b) => parseFloat(a.final_price || a.offer_price || 0) - parseFloat(b.final_price || b.offer_price || 0));
    if (sortOption === "priceHighLow") updated.sort((a, b) => parseFloat(b.final_price || b.offer_price || 0) - parseFloat(a.final_price || a.offer_price || 0));
    if (sortOption === "offerHighLow") updated.sort((a, b) => parseFloat(b.offer || 0) - parseFloat(a.offer || 0));
    if (sortOption === "offerLowHigh") updated.sort((a, b) => parseFloat(a.offer || 0) - parseFloat(b.offer || 0));

    setFilteredProducts([...updated]);
    setCurrentPage(1);
  }, [
    search, selectedCategory, selectedSubCategory, selectedColor,
    selectedSize, priceRange, offerFilter, sortOption, products,
  ]);

  useEffect(() => {
    if (defaultCategory) {
      setSelectedCategory(defaultCategory);
      setShowFilters(true);
    }
  }, [defaultCategory]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setGridView(4);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── Derived Filter Data ────────────────────────────────────── */
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const subCategories = [
    ...new Set(
      products
        .filter((p) => 
          p.category?.trim().toLowerCase() ===
          decodeURIComponent(selectedCategory || "").trim().toLowerCase()
        )
        .map((p) => p.subcategory)
        .filter(Boolean),
    ),
  ];
  const colors = selectedCategory
    ? [
      ...new Set(
        products
          .filter((p) => 
            p.category?.trim().toLowerCase() ===
            decodeURIComponent(selectedCategory || "").trim().toLowerCase()
          )
          .flatMap((p) => p.variants?.map((v) => v.colorName)),
      ),
    ]
    : [];
  const sizes = selectedCategory
    ? [
      ...new Set(
        products
          .filter((p) => 
            p.category?.trim().toLowerCase() ===
            decodeURIComponent(selectedCategory || "").trim().toLowerCase()
          )
          .flatMap((p) => p.variants?.flatMap((v) => v.selectedSizes || [])),
      ),
    ]
    : [];

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedColor("");
    setSelectedSize("");
    setPriceRange(10000);
    setOfferFilter(0);
  };

  /* ─── Pagination ─────────────────────────────────────────────── */
  const productsPerPage = gridView === 5 ? 15 : gridView === 4 ? 12 : gridView === 3 ? 9 : gridView === 2 ? 6 : 3;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  /* ─── Grid class ─────────────────────────────────────────────── */
  const gridClass =
    gridView === 5
      ? showFilters ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-5"
      : gridView === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : gridView === 3
      ? "grid-cols-2 lg:grid-cols-3"
      : gridView === 2
      ? "grid-cols-2"
      : "grid-cols-1";

  /* ─── Loading skeleton ───────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <PageHeader title={defaultCategory || "Shop"} />
        <div className="px-4 md:px-10 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-[300px]" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Shop" />

      {/* ── Toolbar ── */}
      <div className="px-4 md:px-10 mt-6">
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-3">

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition font-medium text-sm cursor-pointer w-fit"
          >
            {showFilters ? <FiX size={18} /> : <FiFilter size={18} />}
            {showFilters ? "Close" : "Filters"}
          </button>

          {/* Search */}
          <div className="flex items-center gap-3 flex-1 w-full">
            <FiSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search products, codes..."
              className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Sort + Grid */}
          <div className="flex flex-wrap items-center gap-3 md:border-l md:pl-4 pt-2 md:pt-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-600 font-medium">Sort By</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="text-sm border rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="">Default</option>
                <option value="az">A – Z</option>
                <option value="za">Z – A</option>
                <option value="priceLowHigh">Price Low → High</option>
                <option value="priceHighLow">Price High → Low</option>
                <option value="offerHighLow">Offer High → Low</option>
                <option value="offerLowHigh">Offer Low → High</option>
              </select>
            </div>

            {/* Grid view selectors */}
            <div className="flex items-center gap-2">
              {/* Desktop Grid Icons */}
              <button
                onClick={() => setGridView(5)}
                className={`hidden lg:flex p-2 border rounded ${gridView === 5 ? "bg-primary text-white" : "border-gray-300"
                  }`}
              >
                <BsGrid3X3Gap size={16} />
              </button>

              <button
                onClick={() => setGridView(4)}
                className={`hidden lg:flex p-2 border rounded ${gridView === 4 ? "bg-primary text-white" : "border-gray-300"
                  }`}
              >
                <BsGridFill size={16} />
              </button>

              <button
                onClick={() => setGridView(3)}
                className={`hidden lg:flex p-2 border rounded ${gridView === 3 ? "bg-primary text-white" : "border-gray-300"
                  }`}
              >
                <BsGrid3X2 size={16} />
              </button>

              {/* Mobile Grid Icons */}
              <button
                onClick={() => setGridView(2)}
                className={`lg:hidden flex p-2 border rounded ${gridView === 2 ? "bg-primary text-white" : "border-gray-300"
                  }`}
              >
                <BsGrid1X2 size={16} />
              </button>

              <button
                onClick={() => setGridView(1)}
                className={`lg:hidden flex p-2 border rounded ${gridView === 1 ? "bg-primary text-white" : "border-gray-300"
                  }`}
              >
                <BsGridFill size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 md:px-10 mt-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-800">{filteredProducts.length}</span> of {products.length} products
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start mt-4 w-full">
        {/* ── Filter Sidebar ── */}
        {showFilters && (
          <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-8 lg:ml-10 lg:sticky lg:top-24 h-fit mb-4 lg:mb-0">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-800">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded-2xl cursor-pointer font-medium"
              >
                Clear
              </button>
            </div>

            {/* Price */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">Price</h4>
              <input
                type="range" min="0" max="10000" value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full accent-green-600"
              />
              <p className="text-sm mt-1">Up to ₹{Number(priceRange).toLocaleString()}</p>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">Category</h4>
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 mb-2 cursor-pointer">
                    <input
                      type="radio" name="category" className="accent-green-600"
                      checked={
                        cat?.trim().toLowerCase() ===
                        decodeURIComponent(selectedCategory || "").trim().toLowerCase()
                      }
                      onChange={() => setSelectedCategory(cat)}
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </label>
                ))}
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory("")} className="text-xs text-red-400 mt-1 hover:text-red-600">
                    × Clear Category
                  </button>
                )}
              </div>
            )}

            {/* SubCategory */}
            {selectedCategory && subCategories.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">SubCategory</h4>
                {subCategories.map((sub) => (
                  <label key={sub} className="flex items-center gap-3 mb-2 cursor-pointer">
                    <input
                      type="radio" name="subcategory" className="accent-green-600"
                      checked={selectedSubCategory === sub}
                      onChange={() => setSelectedSubCategory(sub)}
                    />
                    <span className="text-sm text-gray-700">{sub}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">Colors</h4>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 text-xs font-medium border rounded-full transition ${selectedColor === color
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:border-primary"
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">Sizes</h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 text-sm font-semibold border rounded-lg transition ${selectedSize === size
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:border-primary"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Offers */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-800 border-b pb-1">Offers</h4>
              {[10, 20, 30, 40, 50].map((offer) => (
                <label key={offer} className="flex items-center gap-3 mb-2 cursor-pointer">
                  <input
                    type="radio" name="offer" className="accent-green-600"
                    checked={offerFilter === offer}
                    onChange={() => setOfferFilter(offer)}
                  />
                  <span className="text-sm text-gray-700">{offer}% and above</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS GRID */}

        <div className="flex-1">
          <div
            className={`px-4 md:px-10 py-6 grid gap-6 
  ${gridView === 5
                ? showFilters
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-5"
                : gridView === 4
                  ? "lg:grid-cols-4"
                  : gridView === 3
                    ? "lg:grid-cols-3"
                    : gridView === 2
                      ? "grid-cols-2"
                      : "grid-cols-1"
              }`}
          >
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p>No products found</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10 flex-wrap pb-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                <FiChevronLeft size={18} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg border transition cursor-pointer ${currentPage === page
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-white hover:bg-gray-100"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Shop;
