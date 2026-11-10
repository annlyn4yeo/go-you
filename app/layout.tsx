import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

// Only weights that are used: no faux bold (Space Grotesk tops out at 700).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "GO—YOU", template: "%s — GO—YOU" },
  description: "Train. Log. Progress.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover", // lets the bottom bar respect the home indicator
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
