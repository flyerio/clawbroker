import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://clawbroker.ai", lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: "https://clawbroker.ai/sign-in", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
