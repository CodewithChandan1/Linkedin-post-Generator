"use client";
// Pre-Post Comment Seeding — PRD §4.11

import { useState, useEffect } from "react";
import { MessageSquare, Mail } from "lucide-react";
import {
  loadSeedConnections,
  saveSeedConnections,
  generateSeedDMs,
} from "@/lib/seedConnections";

export default function CommentSeedingPanel({ post, onClose }) {
  const [connections, setConnections] = useState([]);
  const [newName, setNewName] = useState("");
  const [dms, setDms] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const loaded = loadSeedConnections();
    setConnections(loaded);
    if (loaded.length > 0) {
      setDms(generateSeedDMs(post?.topic, loaded));
    }
  }, [post?.topic]);

  function addConnection() {
    if (!newName.trim()) return;
    const updated = [...connections, { name: newName.trim(), id: Date.now() }];
    setConnections(updated);
    saveSeedConnections(updated);
    setDms(generateSeedDMs(post?.topic, updated));
    setNewName("");
  }

  function removeConnection(id) {
    const updated = connections.filter((c) => c.id !== id);
    setConnections(updated);
    saveSeedConnections(updated);
    setDms(generateSeedDMs(post?.topic, updated));
  }

  async function copyDM(text, idx) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><MessageSquare size={16} /> Comment Seeding</h2>
            <p className="text-xs text-gray-500 mt-0.5">Prime early engagement — send DMs before posting</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p className="font-medium mb-1">Why this works:</p>
            <p>Early comments from relevant people = algorithm pushes post to their networks too. This is the #1 organic reach hack that isn't an engagement pod.</p>
          </div>

          {/* Add connection */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Your trusted connections (add 3–5)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addConnection()}
                placeholder="Friend's first name"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
              />
              <button
                onClick={addConnection}
                disabled={!newName.trim()}
                className="bg-linkedin text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-linkedin-hover"
              >
                Add
              </button>
            </div>
          </div>

          {/* Connections list */}
          {connections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {connections.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-linkedin/10 text-linkedin text-xs px-2.5 py-1 rounded-full">
                  <span>{c.name}</span>
                  <button
                    onClick={() => removeConnection(c.id)}
                    className="text-linkedin/60 hover:text-red-500 leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Generated DMs */}
          {dms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Mail size={13} /> DM templates — send these 10 mins before posting:
              </p>
              <div className="space-y-2">
                {dms.map((dm, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-3">
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-gray-600 mb-0.5">To: {dm.name}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{dm.dm}</p>
                    </div>
                    <button
                      onClick={() => copyDM(dm.dm, i)}
                      className="shrink-0 self-start text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full hover:bg-linkedin/10"
                    >
                      {copied === i ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {connections.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              Add a few trusted developer friends above — their early comments in the golden window can double your post's reach
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
