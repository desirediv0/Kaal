const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaaltools.com";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function fetchProductSlugs() {
  if (!apiUrl) return [];
  try {
    let allSlugs = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await fetch(
        `${apiUrl}/product/all?page=${page}&limit=1000`,
        {
          next: { revalidate: 3600 },
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) break;
      const json = await res.json();
      const products = json?.data?.products || json?.data || [];
      const slugs = (Array.isArray(products) ? products : [])
        .map((p) => p?.slug)
        .filter(Boolean);
      allSlugs = allSlugs.concat(slugs);
      const totalPages = json?.data?.totalPages || 1;
      hasMore = page < totalPages && slugs.length > 0;
      page++;
    }
    return [...new Set(allSlugs)];
  } catch {
    return [];
  }
}

async function fetchSubcategorySlugs() {
  if (!apiUrl) return [];
  try {
    let allSlugs = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await fetch(`${apiUrl}/category?page=${page}&limit=100`, {
        next: { revalidate: 3600 },
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) break;
      const json = await res.json();
      const categories = json?.data?.categories || json?.data || [];
      const cats = Array.isArray(categories) ? categories : [];
      for (const cat of cats) {
        const subs = cat?.subCategories || [];
        for (const sub of subs) {
          const name = sub?.name;
          if (name) {
            allSlugs.push(encodeURIComponent(name.toLowerCase().trim()));
          }
        }
      }
      const totalPages = json?.data?.totalPages || 1;
      hasMore = page < totalPages && cats.length > 0;
      page++;
    }
    return [...new Set(allSlugs)];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const [productSlugs, subcategorySlugs] = await Promise.all([
    fetchProductSlugs(),
    fetchSubcategorySlugs(),
  ]);

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/product`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
  ];

  const productPages = productSlugs.map((slug) => ({
    url: `${baseUrl}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const subcategoryPages = subcategorySlugs.map((slug) => ({
    url: `${baseUrl}/product/subcategory/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...productPages, ...subcategoryPages];
}
