"use client";

import { useState, useEffect } from "react";
import { X, Edit3, Check, FileText, Image as ImageIcon } from "lucide-react";

export default function EditPostModal({ open, post, onSave, onClose }) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (post) {
      setContent(post.content || "");
      setHashtags((post.hashtags || []).join(" "));
      setImageUrl(post.imageUrl || "");
    }
  }, [post]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !post) return null;

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const updatedHashtags = hashtags
      .split(/\s+/)
      .filter((t) => t.startsWith("#"))
      .map((t) => t.trim());

    onSave({
      ...post,
      content: content.trim(),
      hashtags: updatedHashtags,
      imageUrl: imageUrl,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Edit3 size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Edit Post</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Refine post content and select custom visuals</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
          {/* Post Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <FileText size={12} className="text-gray-400" /> Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 resize-none transition placeholder-gray-400 leading-relaxed font-semibold"
              placeholder="Write your post..."
            />
            <div className="flex justify-end text-[10px] text-gray-400 font-bold px-1">
              <span>{content.length} characters</span>
            </div>
          </div>

          {/* Hashtags Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400 font-bold"
              placeholder="#react #nodejs #webdev"
            />
          </div>

          {/* Image Selection Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <ImageIcon size={13} className="text-gray-400" /> Custom Visual / Banner Image
            </label>
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-150 max-w-md shadow-sm">
                <img src={imageUrl} alt="Post media banner" className="w-full h-auto max-h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2.5 right-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow-md active:scale-95"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-3 bg-gray-50/50">
                <ImageIcon size={20} className="mx-auto text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600 font-bold">No custom image active</p>
                  <p className="text-[10px] text-gray-450 mt-0.5 leading-normal">Upload your own illustration, screenshot, or banner instead of the AI generated image</p>
                </div>
                <label className="inline-block bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-sm">
                  Choose Custom Image file
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button 
            onClick={onClose} 
            className="text-xs text-gray-600 font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="text-xs text-white bg-linkedin hover:bg-linkedin-hover font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
