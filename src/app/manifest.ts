import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Amigo Secreto",
    short_name: "Amigo Secreto",
    description: "Um cantinho da família para partilhar desejos e escolher presentes com carinho.",
    lang: "pt-PT",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf6ed",
    theme_color: "#234f3e",
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
