import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
    ],
    sitemap: "https://lead-to-launch.app/sitemap.xml",
  };
}
