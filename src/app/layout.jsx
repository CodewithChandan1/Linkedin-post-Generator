import "./globals.css";

export const metadata = {
  title: "LinkedIn Auto-Post Generator",
  description: "Daily AI-generated LinkedIn posts for Chandan Kushwaha",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
