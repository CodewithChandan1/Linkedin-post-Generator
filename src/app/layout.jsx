import "./globals.css";

export const metadata = {
  title: "PostedIn – AI LinkedIn Post Generator for Developers",
  description: "Generate high-converting LinkedIn posts, threads, and developer content in seconds with AI. PostedIn helps you grow your LinkedIn presence 10x faster.",
  keywords: "LinkedIn post generator, AI LinkedIn content, developer LinkedIn, PostedIn, LinkedIn AI tool, LinkedIn growth",
  authors: [{ name: "PostedIn" }],
  openGraph: {
    title: "PostedIn – AI LinkedIn Post Generator",
    description: "Generate viral LinkedIn posts for developers in seconds using AI. Grow your professional presence effortlessly.",
    url: "https://postedin.ai",
    siteName: "PostedIn",
    type: "website",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "PostedIn Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PostedIn – AI LinkedIn Post Generator",
    description: "Grow your LinkedIn with AI-generated developer content. 10x faster posts.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

