import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sylvy",
    short_name: "Sylvy",
    description:
      "Sylvy is an AI-native lab assistant that structures experiments, analyzes results, and learns from your lab's own data to accelerate wet lab and pharma research.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#00ac73",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

