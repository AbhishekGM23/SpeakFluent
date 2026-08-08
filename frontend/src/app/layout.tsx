import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
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
        <Script id="ad-script" strategy="afterInteractive">
          {`
            (function(tzuf){
            var d = document,
                s = d.createElement('script'),
                l = d.scripts[d.scripts.length - 1];
            s.settings = tzuf || {};
            s.src = "\/\/juvenilechoice.com\/bRX.VYsid\/Gcl\/0sY\/Wlcx\/ceLmH9JuYZGUolxk\/PfTrctzqM\/DmAR5_MUjCUltKNhzvMvwlMBDEkwyGO\/Qr";
            s.async = true;
            s.referrerPolicy = 'no-referrer-when-downgrade';
            l.parentNode.insertBefore(s, l);
            })({})
          `}
        </Script>
      </body>
    </html>
  );
}
