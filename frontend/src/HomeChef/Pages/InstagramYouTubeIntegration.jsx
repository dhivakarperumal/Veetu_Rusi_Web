import React, { useState } from "react";
import { Camera, Youtube, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const InstagramYouTubeIntegration = () => {
  const [integrations, setIntegrations] = useState({
    instagram: { connected: false, username: "", followersCount: 0 },
    youtube: { connected: false, channelName: "", subscribersCount: 0 },
  });

  const [formData, setFormData] = useState({
    instagramHandle: "",
    youtubeChannelUrl: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleConnectInstagram = (e) => {
    e.preventDefault();
    if (!formData.instagramHandle.trim()) {
      toast.error("Please enter Instagram handle");
      return;
    }
    setIntegrations({
      ...integrations,
      instagram: {
        connected: true,
        username: formData.instagramHandle,
        followersCount: Math.floor(Math.random() * 10000),
      },
    });
    toast.success("Instagram connected!");
    setFormData({ ...formData, instagramHandle: "" });
  };

  const handleConnectYouTube = (e) => {
    e.preventDefault();
    if (!formData.youtubeChannelUrl.trim()) {
      toast.error("Please enter YouTube channel URL");
      return;
    }
    setIntegrations({
      ...integrations,
      youtube: {
        connected: true,
        channelName: formData.youtubeChannelUrl,
        subscribersCount: Math.floor(Math.random() * 50000),
      },
    });
    toast.success("YouTube connected!");
    setFormData({ ...formData, youtubeChannelUrl: "" });
  };

  const handleDisconnect = (platform) => {
    setIntegrations({
      ...integrations,
      [platform]: {
        connected: false,
        username: "",
        followersCount: 0,
        channelName: "",
        subscribersCount: 0,
      },
    });
    toast.success(`${platform} disconnected!`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Social Media Integration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your Instagram and YouTube accounts to promote your food
        </p>
      </div>

      {/* Instagram Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Camera className="w-8 h-8 text-pink-600" />
          <h2 className="text-2xl font-bold text-slate-900">Instagram</h2>
        </div>

        {!integrations.instagram.connected ? (
          <form onSubmit={handleConnectInstagram} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Instagram Handle
              </label>
              <input
                type="text"
                name="instagramHandle"
                value={formData.instagramHandle}
                onChange={handleInputChange}
                placeholder="e.g., @myrestaurant"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600"
            >
              Connect Instagram
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Account</p>
                <p className="text-lg font-bold text-slate-900">
                  @{integrations.instagram.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Followers</p>
                <p className="text-2xl font-bold text-pink-600">
                  {integrations.instagram.followersCount.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDisconnect("instagram")}
              className="w-full px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* YouTube Section */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Youtube className="w-8 h-8 text-red-600" />
          <h2 className="text-2xl font-bold text-slate-900">YouTube</h2>
        </div>

        {!integrations.youtube.connected ? (
          <form onSubmit={handleConnectYouTube} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                YouTube Channel URL
              </label>
              <input
                type="url"
                name="youtubeChannelUrl"
                value={formData.youtubeChannelUrl}
                onChange={handleInputChange}
                placeholder="e.g., https://youtube.com/c/yourChannel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600"
            >
              Connect YouTube
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Channel</p>
                <p className="text-lg font-bold text-slate-900">
                  {integrations.youtube.channelName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Subscribers</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.youtube.subscribersCount.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDisconnect("youtube")}
              className="w-full px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Benefits of Integration
        </h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            Automatically share your food preparation videos
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            Reach more customers and build your community
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            Drive traffic to your store
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            Track engagement and grow your audience
          </li>
        </ul>
      </div>
    </div>
  );
};

export default InstagramYouTubeIntegration;
