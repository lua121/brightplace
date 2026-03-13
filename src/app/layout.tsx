import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "brightplace — Find Your Next Home",
  description: "Conversational apartment search powered by brightplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
