/**
 * Utility to manipulate images client-side, specifically stripping EXIF/metadata.
 */

const IMAGE_STYLE_SUFFIX =
  ", realistic, natural, cinematic, professional, clean, minimal, tech aesthetic, LinkedIn post visual";

/**
 * Builds a pollinations.ai image URL from a raw image prompt.
 * Pass a `seed` to get a different image for the same prompt (used to regenerate
 * just the visual without touching the post content).
 * @param {string} prompt raw imagePrompt stored on the post
 * @param {number} [seed] optional seed for a fresh variation
 */
export function buildPostImageUrl(prompt, seed) {
  if (!prompt) return "";
  const decorated = encodeURIComponent(prompt + IMAGE_STYLE_SUFFIX);
  const seedParam = seed != null ? `&seed=${seed}` : "";
  return `https://image.pollinations.ai/prompt/${decorated}?width=1080&height=1080&nologo=true${seedParam}`;
}

/**
 * Downloads an image from a URL, drawing it to canvas first to strip metadata (EXIF, location, camera details, etc.)
 * @param {string} imageUrl 
 * @param {string} filename 
 */
export async function downloadCleanImage(imageUrl, filename = "linkedin-post-visual.png") {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    const cleanedBlob = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas export failed"));
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Failed to load image into canvas"));
      img.src = URL.createObjectURL(blob);
    });

    const url = URL.createObjectURL(cleanedBlob);
    const a = document.createElement;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download clean image, falling back to direct open:", error);
    window.open(imageUrl, "_blank");
  }
}
