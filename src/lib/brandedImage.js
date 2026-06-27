// Branded vertical image generator — PRD bonus.
// Canvas-renders a 1080×1920 (9:16) PNG from a post's hook, branded with the
// author's name + handle, for mobile-first single-image LinkedIn posts.
// 9:16 takes ~32% more feed real estate and 91% of LinkedIn engagement is mobile.

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Picks the headline/hook to feature — first non-empty line, trimmed to a quote length.
function pickHeadline(text) {
  const firstLine = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0) || "";
  const clean = firstLine.replace(/^[#>\-*\s]+/, "");
  return clean.length > 160 ? clean.slice(0, 157).trimEnd() + "…" : clean;
}

export function downloadBrandedImage({ text, name = "Developer", headline = "", handle = "", filename } = {}) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient (LinkedIn-inspired deep blue).
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0A66C2");
  grad.addColorStop(1, "#04294f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle accent bar at top.
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(96, 150, 90, 10);

  const PAD = 96;
  const maxWidth = W - PAD * 2;

  // Featured hook/quote.
  const headlineText = pickHeadline(text) || `${name} on LinkedIn`;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 76px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.textBaseline = "top";

  const lines = wrapText(ctx, headlineText, maxWidth);
  const lineHeight = 96;
  const blockHeight = lines.length * lineHeight;
  let y = (H - blockHeight) / 2 - 80;
  for (const line of lines) {
    ctx.fillText(line, PAD, y);
    y += lineHeight;
  }

  // Footer — author identity.
  const footerY = H - 260;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(PAD, footerY - 30, maxWidth, 2);

  // Avatar circle with initials.
  const initials =
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const avX = PAD + 50;
  const avY = footerY + 50;
  ctx.beginPath();
  ctx.arc(avX, avY, 50, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.fillStyle = "#0A66C2";
  ctx.font = "700 40px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, avX, avY + 2);

  // Name + headline / handle.
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 46px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.fillText(name, avX + 80, footerY + 18);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "400 34px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  const sub = handle || headline || "Follow for more";
  ctx.fillText(sub.length > 46 ? sub.slice(0, 45) + "…" : sub, avX + 80, footerY + 74);

  // Download.
  const safe = name.replace(/\s+/g, "_");
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${safe}_linkedin_9x16.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
