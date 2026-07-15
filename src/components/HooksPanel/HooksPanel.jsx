import { Sparkles } from "lucide-react";

export default function HooksPanel({ hooks, activeHook, onSelectHook }) {
  if (!hooks || hooks.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3.5">
      <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
        <Sparkles size={13} className="text-linkedin" /> Alternate Hooks — Pick One
      </p>
      <div className="space-y-2.5">
        {hooks.map((hook, i) => {
          const isActive = activeHook === hook;
          return (
            <button
              key={i}
              onClick={() => onSelectHook(hook)}
              className={`w-full text-left text-xs rounded-xl px-4 py-3.5 transition-all leading-relaxed active:scale-[0.99] shadow-sm flex items-center justify-between gap-4 ${
                isActive
                  ? "bg-[#0A66C2]/5 text-[#0A66C2] border-2 border-[#0A66C2] font-black"
                  : "text-gray-700 bg-gray-50/30 hover:bg-linkedin/5 border border-gray-200/80 hover:border-linkedin/30 font-semibold"
              }`}
            >
              <span className="flex-1">{hook}</span>
              {isActive && (
                <span className="shrink-0 text-[8px] font-extrabold bg-[#0A66C2] text-white px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm animate-pulse">
                  Active Hook
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 font-semibold border-t border-gray-55 pt-2.5">
        * Click any suggestion to automatically replace the opening hook of your post.
      </p>
    </div>
  );
}
