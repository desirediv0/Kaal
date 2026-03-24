export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaaltools.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/private/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/_next/", "/private/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/_next/", "/private/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
