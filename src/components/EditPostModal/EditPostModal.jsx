import { useState } from "react";

export default function EditPostModal({ open, post, onSave, onClose }) {
  const [content, setContent] = useState(post?.content || "");
  const [hashtags, setHashtags] = useState((post?.hashtags || []).join(" "));

  if (!open || !post) return null;

  function handleSave() {
    const updatedHashtags = hashtags
      .split(/\s+/)
      .filter((t) => t.startsWith("#"))
      .map((t) => t.trim());

    onSave({
      ...post,
      content: content.trim(),
      hashtags: updatedHashtags,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-30 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Edit post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/40 resize-y leading-relaxed"
              placeholder="Write your post..."
            />
            <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/40"
              placeholder="#react #nodejs #webdev"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button onClick={onClose} className="text-sm text-gray-600 px-4 py-2 rounded-full hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="text-sm text-white bg-linkedin hover:bg-linkedin-hover px-4 py-2 rounded-full font-medium disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
