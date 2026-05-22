import React, { useState } from "react";
import { Upload, Play, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const UploadFoodVideos = () => {
  const [videos, setVideos] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoFile: null,
    thumbnail: null,
    category: "",
    tags: [],
  });

  const [tag, setTag] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [name]: file });
    }
  };

  const addTag = () => {
    if (tag.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
      setTag("");
    }
  };

  const removeTag = (index) => {
    const updated = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.videoFile) {
      toast.error("Please fill all required fields");
      return;
    }
    setVideos([
      ...videos,
      { ...formData, id: Date.now(), uploadedAt: new Date() },
    ]);
    toast.success("Video uploaded successfully!");
    setFormData({
      title: "",
      description: "",
      videoFile: null,
      thumbnail: null,
      category: "",
      tags: [],
    });
  };

  const deleteVideo = (id) => {
    setVideos(videos.filter((v) => v.id !== id));
    toast.success("Video deleted!");
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Upload Food Preparation Videos
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your cooking process and engage with customers
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Video Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., How to make Biryani"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your video..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="">Select Category</option>
              <option value="tutorial">Tutorial</option>
              <option value="review">Customer Review</option>
              <option value="process">Cooking Process</option>
              <option value="tips">Cooking Tips</option>
            </select>
          </div>

          {/* Video File */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Video File *
            </label>
            <input
              type="file"
              name="videoFile"
              accept="video/*"
              onChange={handleFileUpload}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Thumbnail Image
          </label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g., Indian, Vegetarian"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((t, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" /> Upload Video
        </button>
      </form>

      {/* Videos List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your Videos</h2>
        {videos.length === 0 ? (
          <p className="text-gray-500">No videos uploaded yet.</p>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow p-6 flex justify-between items-start"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Category: {video.category || "Uncategorized"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteVideo(video.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFoodVideos;
