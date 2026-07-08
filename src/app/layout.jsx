import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://postedin.ai";
const APP_NAME = "PostedIn";
const TITLE = "PostedIn – AI LinkedIn Post Generator for Developers";
const DESCRIPTION =
  "Generate high-converting LinkedIn posts, carousels, newsletters, and developer content in seconds using AI. PostedIn helps you grow your LinkedIn presence with daily posts, golden-hour timing, topic authority tracking, and one-click publishing.";

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: DESCRIPTION,

  // ── Canonical & Alternates ─────────────────────────────────────────────────
  alternates: {
    canonical: "/",
  },

  // ── Keywords (still used by some engines & AEO) ───────────────────────────
  keywords: [
    "LinkedIn post generator",
    "AI LinkedIn content",
    "LinkedIn post automation",
    "developer LinkedIn growth",
    "PostedIn",
    "LinkedIn AI tool",
    "LinkedIn carousel generator",
    "LinkedIn newsletter generator",
    "LinkedIn golden hour",
    "LinkedIn algorithm 2026",
    "LinkedIn post scheduler",
    "AI content for developers",
    "LinkedIn topic authority",
    "LinkedIn humanizer",
    "LinkedIn streak tracker",
  ],

  // ── Authors & Publisher ────────────────────────────────────────────────────
  authors: [{ name: "PostedIn Team", url: APP_URL }],
  creator: "PostedIn",
  publisher: "PostedIn",

  // ── Open Graph (social sharing + GEO context) ──────────────────────────────
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "PostedIn – AI LinkedIn Post Generator dashboard showing daily post feed",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@PostedInAI",
    creator: "@PostedInAI",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
  },

  // ── Icons ──────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.png",
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (add your codes here) ───────────────────────────────────
  verification: {
    // google: "your-google-search-console-verification-code",
    // bing: "your-bing-webmaster-verification-code",
  },

  // ── App-specific meta ─────────────────────────────────────────────────────
  applicationName: APP_NAME,
  category: "Technology",
  classification: "Productivity / Developer Tools",
};

// ── Structured Data (JSON-LD) for SEO + AEO + GEO ──────────────────────────
// Helps Google's AI Overviews, Bing Copilot, ChatGPT browsing, and Perplexity
// understand exactly what PostedIn is, who it's for, and what it does.
function WebAppJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // 1. SoftwareApplication — for app stores, AI engines, search
      {
        "@type": "SoftwareApplication",
        "@id": `${APP_URL}/#software`,
        "name": APP_NAME,
        "url": APP_URL,
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Social Media Management",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free plan available. Premium features for power users.",
        },
        "description": DESCRIPTION,
        "screenshot": `${APP_URL}/logo.png`,
        "featureList": [
          "AI LinkedIn post generation using Gemini 2.5 Flash",
          "PDF carousel auto-generator (6.6% avg engagement format)",
          "Golden Hour engagement assistant with 90-minute countdown",
          "AI humanizer layer to bypass LinkedIn AI-detection penalty",
          "Depth Score optimizer for LinkedIn Nexus algorithm",
          "Topic DNA tracker for building niche authority",
          "Trending tech news scanner (GitHub, HackerNews, dev.to, npm)",
          "LinkedIn OAuth one-click publishing",
          "Evergreen post recycler — resurface top posts every 90 days",
          "LinkedIn Newsletter auto-generator",
          "Strategic comment generator",
          "Opportunity tracker for ROI visibility",
          "Email reminders with best-time algorithm",
          "Streak tracker and alert system",
          "Profile SEO auditor",
        ],
        "creator": {
          "@type": "Organization",
          "@id": `${APP_URL}/#organization`,
          "name": APP_NAME,
          "url": APP_URL,
        },
      },
      // 2. WebSite — enables Sitelinks searchbox in Google
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        "url": APP_URL,
        "name": APP_NAME,
        "description": DESCRIPTION,
        "publisher": { "@id": `${APP_URL}/#organization` },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${APP_URL}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      // 3. Organization — entity disambiguation for AI engines
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#organization`,
        "name": APP_NAME,
        "url": APP_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${APP_URL}/logo.png`,
          "width": 512,
          "height": 512,
        },
        "sameAs": [],
        "description": "PostedIn is an AI-powered LinkedIn content automation platform for developers. It generates daily posts, carousels, newsletters, and growth analytics using the Gemini API.",
      },
      // 4. FAQPage — AEO: feeds People Also Ask, AI Overviews, voice search
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is PostedIn?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PostedIn is an AI-powered LinkedIn post generator built for developers. It uses Google Gemini API to generate daily LinkedIn posts, PDF carousels, newsletters, and more — then publishes them with one click via LinkedIn OAuth.",
            },
          },
          {
            "@type": "Question",
            "name": "How does PostedIn generate LinkedIn posts?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PostedIn uses the Gemini 2.5 Flash AI model with a personalized system prompt that includes the user's tech stack, projects, and writing style. It then runs a humanizer pass to ensure posts don't trigger LinkedIn's AI-detection penalty (-30% reach).",
            },
          },
          {
            "@type": "Question",
            "name": "Does PostedIn publish directly to LinkedIn?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. PostedIn integrates with LinkedIn OAuth 2.0 using the w_member_social scope. After connecting your LinkedIn account, posts are published with one click via the LinkedIn Share API (ugcPosts endpoint).",
            },
          },
          {
            "@type": "Question",
            "name": "What is the Golden Hour feature in PostedIn?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "After publishing a post, PostedIn activates a 90-minute countdown timer. LinkedIn shows posts to 2-5% of your network first. Strong early engagement triggers wider distribution. The timer prompts you to reply to comments at T+0, T+30, and T+60 minutes.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the Depth Score optimizer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "LinkedIn's 2026 Nexus algorithm introduced Depth Score as its primary ranking signal — measuring dwell time, comment quality, saves, and shares with context. PostedIn structures every post for 1500+ characters, cliff-hanger hooks, and thread-starter closing questions.",
            },
          },
          {
            "@type": "Question",
            "name": "Is PostedIn free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "PostedIn offers a free plan with core post generation. Premium features including PDF carousel generator, AI humanizer, and growth analytics are available on paid plans.",
            },
          },
          {
            "@type": "Question",
            "name": "How does PostedIn avoid LinkedIn's AI content penalty?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "After generating a post with Gemini, PostedIn runs a mandatory second AI pass called the Humanizer. It injects the user's specific projects, personal metrics, casual speech patterns, and authentic doubts — making posts undetectable as AI-written and avoiding the -30% reach, -55% engagement penalty.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* GEO: Explicit hints for AI crawlers about content type and authorship */}
        <meta name="author" content="PostedIn Team" />
        <meta name="application-name" content={APP_NAME} />
        {/* AEO: Speakable hint for voice search — main content region */}
        <meta name="speakable" content="main" />
        {/* Preconnect for performance (LCP improvement → Core Web Vitals → SEO) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <WebAppJsonLd />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

