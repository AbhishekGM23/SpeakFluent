import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Speak Fluent | English Practice",
  description: "Practice spoken English with real people around the world.",
  other: {
    "ce8c6bc01b2f108dbed955a312a32e468099dc95": "ce8c6bc01b2f108dbed955a312a32e468099dc95"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground font-sans min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
