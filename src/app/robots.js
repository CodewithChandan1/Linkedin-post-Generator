// robots.txt — controls crawler access
// Next.js generates /robots.txt from this file

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://postedin.ai";

export default function robots() {
  return {
    rules: [
      {
        // Allow all crawlers including AI (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",        // no crawling API routes
          "/api/auth/",
          "/api/cron/",
        ],
      },
      // Explicitly allow AI crawlers for GEO — some block by default
      { userAgent: "GPTBot",         allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "ClaudeBot",      allow: "/" },
      { userAgent: "PerplexityBot",  allow: "/" },
      { userAgent: "Amazonbot",      allow: "/" },
      { userAgent: "anthropic-ai",   allow: "/" },
      { userAgent: "cohere-ai",      allow: "/" },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
