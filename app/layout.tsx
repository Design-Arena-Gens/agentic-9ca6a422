import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube to Podcast Converter",
  description: "Transform YouTube videos into engaging podcast episodes with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
