import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name}: full-stack engineer`,
    short_name: profile.shortName,
    description: profile.lede,
    start_url: "/",
    display: "standalone",
    background_color: "#0a1a2f",
    theme_color: "#0a1a2f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
