import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

// Set when the site is built, so it changes whenever the content does.
const built = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${profile.siteUrl}/`, lastModified: built, changeFrequency: "monthly", priority: 1 }];
}
