// Presentation themes — colors shared by the in-app preview and the PPTX export.
// Hex values are WITHOUT the leading "#" where used by pptxgenjs, but we keep
// "#"-prefixed here and strip in the exporter for convenience in CSS.

export const PRESENTATION_THEMES = {
  corporate: {
    key: "corporate",
    label: "Corporate",
    bg: "#FFFFFF",
    panel: "#0A66C2", // side accent panel behind image
    title: "#0A66C2",
    body: "#1D2226",
    accent: "#0A66C2",
    muted: "#6B7280",
    titleSlideBg: "#0A66C2",
    titleSlideText: "#FFFFFF",
    gradient: "linear-gradient(135deg, #0A66C2 0%, #084d92 100%)",
  },
  dark: {
    key: "dark",
    label: "Dark",
    bg: "#0F172A",
    panel: "#1E293B",
    title: "#FFFFFF",
    body: "#CBD5E1",
    accent: "#38BDF8",
    muted: "#94A3B8",
    titleSlideBg: "#0B1220",
    titleSlideText: "#FFFFFF",
    gradient: "linear-gradient(135deg, #1E293B 0%, #0F172A 60%, #020617 100%)",
  },
  minimal: {
    key: "minimal",
    label: "Minimal",
    bg: "#FAFAF9",
    panel: "#E7E5E4",
    title: "#111827",
    body: "#374151",
    accent: "#111827",
    muted: "#9CA3AF",
    titleSlideBg: "#111827",
    titleSlideText: "#FFFFFF",
    gradient: "linear-gradient(135deg, #ffffff 0%, #e7e5e4 100%)",
  },
  gradient: {
    key: "gradient",
    label: "Gradient",
    bg: "#1E3A8A",
    panel: "#3B82F6",
    title: "#FFFFFF",
    body: "#DBEAFE",
    accent: "#93C5FD",
    muted: "#BFDBFE",
    titleSlideBg: "#1E3A8A",
    titleSlideText: "#FFFFFF",
    gradient: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 55%, #60A5FA 100%)",
  },
};

export const THEME_LIST = Object.values(PRESENTATION_THEMES);

export function getTheme(key) {
  return PRESENTATION_THEMES[key] || PRESENTATION_THEMES.corporate;
}

// pptxgenjs wants hex WITHOUT the "#".
export function hex(color) {
  return (color || "").replace("#", "");
}
