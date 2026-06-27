import { Sparkles } from "lucide-react";

export default function HooksPanel({ hooks, onSelectHook }) {
  if (!hooks || hooks.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
      <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
        <Sparkles size={13} /> Alternate hooks — pick one
      </p>
      <div className="space-y-2">
        {hooks.map((hook, i) => (
          <button
            key={i}
            onClick={() => onSelectHook(hook)}
            className="w-full text-left text-sm text-gray-800 bg-white border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-50 hover:border-amber-300 transition leading-snug"
          >
            {hook}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-amber-600 mt-2">Click a hook to replace the opening line of your post</p>
    </div>
  );
}
