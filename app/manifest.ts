import type { MetadataRoute } from "next";

// Installable app (DD-039). Opens straight on Train, full screen, in the brand's monochrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "GO—YOU",
    short_name: "GO—YOU",
    description: "Train. Log. Progress.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
