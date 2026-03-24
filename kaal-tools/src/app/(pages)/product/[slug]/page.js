import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

async function fetchProductBySlug(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_URL is not set");
    return null;
  }
  try {
    const res = await fetch(
      `${baseUrl}/product/product/${slug}`,
      {
        next: { revalidate: 60 },
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.success ? data.data : null;
  } catch (e) {
    console.error("Product fetch error:", e);
    return null;
  }
}

function createMetaDescription(html) {
  if (!html) return "";
  const clean = html.replace(/<[^>]*>/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > 160 ? clean.substring(0, 160) + "..." : clean;
}

export async function generateMetadata({ params }) {
  const product = await fetchProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const title = product.seoTitle?.trim() || product.title;
  const description =
    product.seoDesc?.trim() || createMetaDescription(product.description);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient initialProduct={product} />;
}
