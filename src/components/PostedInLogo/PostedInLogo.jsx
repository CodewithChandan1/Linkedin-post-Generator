export default function PostedInLogo({ size = "md", className = "" }) {
  const sizes = {
    sm: { icon: 18, fontSize: "text-base", gap: "gap-1.5", padding: "p-1.5", rounded: "rounded-lg" },
    md: { icon: 22, fontSize: "text-xl", gap: "gap-2", padding: "p-2", rounded: "rounded-xl" },
    lg: { icon: 28, fontSize: "text-2xl", gap: "gap-2.5", padding: "p-2.5", rounded: "rounded-2xl" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Icon Mark */}
      <div className={`${s.padding} bg-[#0A66C2] ${s.rounded} flex items-center justify-center shrink-0`}>
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Document base */}
          <rect x="4" y="3" width="13" height="16" rx="2" fill="white" fillOpacity="0.25" />
          <rect x="4" y="3" width="13" height="16" rx="2" stroke="white" strokeWidth="1.5" />
          {/* "in" text lines */}
          <rect x="7" y="8" width="2" height="7" rx="1" fill="white" />
          <rect x="11" y="10" width="2" height="5" rx="1" fill="white" />
          <circle cx="12" cy="8.5" r="1" fill="white" />
          {/* Chat bubble tail */}
          <path d="M10 19L10 22L14 19" fill="#0A66C2" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <span className={`font-black tracking-tight ${s.fontSize} leading-none`}>
        <span className="text-slate-800">Posted</span>
        <span className="text-[#0A66C2]">In</span>
      </span>
    </div>
  );
}
