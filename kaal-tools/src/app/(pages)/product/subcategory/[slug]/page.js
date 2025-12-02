"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import ProductCard from "@/app/_component/product-card";
import CategorySidebar from "@/app/_component/CategorySidebar";
import CategorySidebarDesktop from "@/app/_component/CategorySidebarDesktop";
import { fetchCategoryProducts, getSubcategoryInfoByName } from "@/Api";

export default function SubcategoryProductsPage({ params }) {
  const router = useRouter();
  const { slug } = params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [subcategoryInfo, setSubcategoryInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Decode the slug first since it's already URL-encoded from the URL params
        const decodedSlug = decodeURIComponent(slug);

        // Fetch both products and subcategory info
        const [productData, subcategoryData] = await Promise.all([
          fetchCategoryProducts({
            subcategoryName: decodedSlug,
          }),
          getSubcategoryInfoByName(decodedSlug),
        ]);

        setProducts(productData.success ? productData.data.products : []);
        setSubcategoryInfo(
          subcategoryData.success ? subcategoryData.data : null
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const decodedSlug = decodeURIComponent(slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner/Header Section */}
      <div className="bg-[#111827] text-white py-14">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-bold uppercase flex items-center justify-center gap-3">
              <ChevronRight className="text-orange-500 text-2xl" size={35} />
              {decodedSlug.replace(/-/g, " ")}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        {/* Mobile Category Sidebar Toggle Button */}
        <div className="mb-6 flex items-center justify-between md:hidden flex-col md:flex-row gap-2">
          <button
            onClick={() => setIsCategorySidebarOpen(true)}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu className="h-5 w-5" />
            Browse Categories
          </button>

          {/* Mobile Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span
              className="cursor-pointer hover:text-gray-800"
              onClick={() => router.push("/")}
            >
              Home
            </span>
            {subcategoryInfo?.category && (
              <>
                <span>/</span>
                <span
                  className="cursor-pointer hover:text-gray-800"
                  onClick={() => {
                    const encodedCategory = encodeURIComponent(
                      subcategoryInfo.category.name.toLowerCase()
                    );
                    router.push(`/product?category=${encodedCategory}`);
                  }}
                >
                  {subcategoryInfo.category.name.toUpperCase()}
                </span>
              </>
            )}
            <span>/</span>
            <span className="text-gray-800">
              {decodedSlug.replace(/-/g, " ").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Desktop Breadcrumb Navigation */}
        <div className="mb-6 hidden md:flex items-center gap-2 text-sm text-gray-600">
          <span
            className="cursor-pointer hover:text-gray-800"
            onClick={() => router.push("/")}
          >
            Home
          </span>
          {subcategoryInfo?.category && (
            <>
              <span>/</span>
              <span
                className="cursor-pointer hover:text-gray-800"
                onClick={() => {
                  const encodedCategory = encodeURIComponent(
                    subcategoryInfo.category.name.toLowerCase()
                  );
                  router.push(`/product?category=${encodedCategory}`);
                }}
              >
                {subcategoryInfo.category.name.toUpperCase()}
              </span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-800 uppercase">
            {decodedSlug.replace(/-/g, " ")}
          </span>
        </div>

        <div className="flex gap-6">
          {/* Desktop Category Sidebar - Always Visible */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <CategorySidebarDesktop />
          </div>

          {/* Mobile Category Sidebar */}
          <CategorySidebar
            isOpen={isCategorySidebarOpen}
            onClose={() => setIsCategorySidebarOpen(false)}
          />

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No products found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                {products
                  .slice()
                  .reverse()
                  .map((product, index) => (
                    <ProductCard
                      key={index}
                      title={product.title}
                      price={product.price}
                      saleprice={product.saleprice}
                      image={product.image}
                      href={`/product/${product.slug}`}
                      className={"bg-[#1155CC] p-2 text-center"}
                      textClass={"text-white font-[400]"}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
