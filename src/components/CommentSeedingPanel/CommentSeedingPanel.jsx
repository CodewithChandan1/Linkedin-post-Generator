"use client";
// Pre-Post Comment Seeding — PRD §4.11

import { useState, useEffect } from "react";
import { MessageSquare, Mail, Plus, X, Check, Copy, Info } from "lucide-react";
import { loadSeedConnections, saveSeedConnections, generateSeedDMs } from "@/lib/seedConnections";

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Comment Seeding Optimizer</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Alert your network to comment early and trigger the LinkedIn feed algorithm</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6">
          
          {/* Info box */}
          <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 text-xs text-blue-800 space-y-2">
            <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-900 flex items-center gap-1">
              <Info size={12} /> Why this works:
            </p>
            <p className="leading-relaxed font-semibold">
              Early comments from trusted connections trigger high relevancy signals. This is the single most powerful organic reach multiplier that is completely safe and terms-compliant.
            </p>
          </div>

          {/* Add connection */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold text-gray-700">Add Trusted Connections (Target 3–5 Friends)</p>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addConnection()}
                placeholder="Friend's first name (e.g. Rahul)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
              />
              <button
                onClick={addConnection}
                disabled={!newName.trim()}
                className="bg-linkedin hover:bg-linkedin-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition active:scale-[0.99] flex items-center gap-1"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Connections list */}
            {connections.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                {connections.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 bg-linkedin/10 text-linkedin text-[10px] font-bold px-3 py-1 rounded-full border border-linkedin/10">
                    <span>{c.name}</span>
                    <button
                      onClick={() => removeConnection(c.id)}
                      className="hover:text-red-500 transition ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated DMs */}
          {dms.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Mail size={13} className="text-linkedin" /> Copy DM Templates &bull; Send 10 Mins Before Posting
              </p>
              
              <div className="space-y-3">
                {dms.map((dm, i) => (
                  <div key={i} className="bg-white border border-gray-200/80 rounded-2xl p-4.5 shadow-sm flex items-start gap-4 justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">To: {dm.name}</p>
                      <p className="text-xs text-gray-700 leading-relaxed font-semibold">&ldquo;{dm.dm}&rdquo;</p>
                    </div>
                    <button
                      onClick={() => copyDM(dm.dm, i)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border shrink-0 transition flex items-center gap-1 ${
                        copied === i
                          ? "bg-linkedin text-white border-linkedin"
                          : "bg-white text-linkedin border-linkedin/30 hover:bg-linkedin/5"
                      }`}
                    >
                      {copied === i ? <Check size={11} /> : null}
                      {copied === i ? "Copied" : "Copy DM"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {connections.length === 0 && (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
              <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-normal">
                Add Rahul, Vivek, or any other close developer friends. Alerting them early in the posting window ensures crucial initial momentum!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
