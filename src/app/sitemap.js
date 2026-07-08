// Auto-generated sitemap — consumed by Google, Bing, and AI crawlers (GEO)
// Next.js generates /sitemap.xml from this file at build time

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://postedin.ai";

export default function sitemap() {
  const now = new Date().toISOString();

  return [
    {
      url: APP_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/notifications`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];
}
