"use client";
import React, { useEffect, useState } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "./product-card";
import CategorySidebar from "./CategorySidebar";
import CategorySidebarDesktop from "./CategorySidebarDesktop";
import {
  fetchCategoryProducts,
  getAllCategoriesAndSubCategories,
  getSubcategoriesByCategory,
} from "@/Api";
import Image from "next/image";

const stripHtml = (html) => {
  return html?.replace(/<[^>]*>/g, "") || "";
};

export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState("categories"); // 'categories' or 'subcategories'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);

  const currentCategory = searchParams.get("category");
  const currentSubcategory = searchParams.get("subcategory");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateUrl = (params) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    newParams.delete("subcategory");

    if (params.category) {
      newParams.set("category", params.category.toLowerCase());
    }
    if (params.subcategory) {
      const encodedSubcategory = encodeURIComponent(
        params.subcategory.toLowerCase()
      );
      newParams.set("subcategory", encodedSubcategory);
    }

    router.push(`/product?${newParams.toString()}`);
  };

  const handleCategoryClick = async (category) => {
    setLoading(true);
    try {
      const subcategoryData = await getSubcategoriesByCategory(category.name);

      if (subcategoryData.success) {
        setSelectedCategory({
          ...category,
          subCategories: subcategoryData.data.subcategories,
        });
        setViewMode("subcategories");
        updateUrl({ category: category.name });
      } else {
        console.error(
          "Failed to fetch subcategories:",
          subcategoryData.message
        );
        // Fallback to original category data
        setSelectedCategory(category);
        setViewMode("subcategories");
        updateUrl({ category: category.name });
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      // Fallback to original category data
      setSelectedCategory(category);
      setViewMode("subcategories");
      updateUrl({ category: category.name });
    } finally {
      setLoading(false);
    }
    setIsSidebarOpen(false);
    // Don't close category sidebar - keep it open
    scrollToTop();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoryParam = searchParams.get("category");
        const subcategoryParam = searchParams.get("subcategory");

        if (subcategoryParam) {
          // Show only products for subcategory
          const decodedSubcategory = decodeURIComponent(subcategoryParam);
          const productData = await fetchCategoryProducts({
            subcategoryName: decodedSubcategory,
          });
          setProducts(
            productData.success
              ? productData.data.products.map((product) => ({
                  ...product,
                  shortDesc: stripHtml(product.shortDesc),
                  description: stripHtml(product.description),
                }))
              : []
          );
          setViewMode("products");
        } else if (categoryParam) {
          // Show only subcategories for category
          const decodedCategory = decodeURIComponent(categoryParam);

          // First fetch categories if not already loaded
          let categoryData = null;
          if (categories.length === 0) {
            categoryData = await getAllCategoriesAndSubCategories();
            if (categoryData.success) {
              const filteredCategories = categoryData.data.filter(
                (cat) => cat.name !== "Uncategorized" && cat.name !== "All"
              );
              setCategories(filteredCategories);
            }
          }

          // Find the category
          const categoriesToSearch =
            categories.length > 0
              ? categories
              : categoryData?.success
              ? categoryData.data.filter(
                  (cat) => cat.name !== "Uncategorized" && cat.name !== "All"
                )
              : [];

          let category = null;
          if (categoriesToSearch.length > 0) {
            category = categoriesToSearch.find(
              (cat) => cat.name.toLowerCase() === decodedCategory.toLowerCase()
            );
            if (!category) {
              category = categoriesToSearch.find(
                (cat) =>
                  cat.name
                    .toLowerCase()
                    .includes(decodedCategory.toLowerCase()) ||
                  decodedCategory.toLowerCase().includes(cat.name.toLowerCase())
              );
            }
            if (!category) {
              const cleanDecodedCategory = decodedCategory
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, "")
                .trim();
              category = categoriesToSearch.find(
                (cat) =>
                  cat.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .trim() === cleanDecodedCategory
              );
            }
          }

          if (category) {
            const subcategoryData = await getSubcategoriesByCategory(
              category.name
            );
            setSelectedCategory({
              ...category,
              subCategories: subcategoryData.success
                ? subcategoryData.data.subcategories
                : [],
            });
            setViewMode("subcategories");
          } else {
            setSelectedCategory(null);
            setViewMode("subcategories");
          }
        } else {
          // No params: show all categories
          const categoryData = await getAllCategoriesAndSubCategories();
          if (categoryData.success) {
            const filteredCategories = categoryData.data.filter(
              (cat) => cat.name !== "Uncategorized" && cat.name !== "All"
            );
            setCategories(filteredCategories);
          }
          setViewMode("categories");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [searchParams]);

  // Only show categories if viewMode is 'categories' and no category/subcategory param
  const renderCategories = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => handleCategoryClick(category)}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2 uppercase">
            {category.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {category.subCategories?.length || 0} subcategories
          </p>
        </div>
      ))}
    </div>
  );

  // Only show subcategories if viewMode is 'subcategories' and selectedCategory is set
  const renderSubcategories = () => {
    if (!selectedCategory) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No category selected</p>
        </div>
      );
    }
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-2">
          {selectedCategory.subCategories &&
          selectedCategory.subCategories.length > 0 ? (
            selectedCategory.subCategories.map((subcategory) => (
              <div
                key={subcategory.id}
                onClick={() => {
                  // Navigate to the dedicated subcategory page instead of using query params
                  const encodedSubcategory = encodeURIComponent(
                    subcategory.name.toLowerCase()
                  );
                  router.push(`/product/subcategory/${encodedSubcategory}`);
                }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative h-full flex flex-col cursor-pointer hover:scale-105 transform"
              >
                <div className="relative flex-shrink-0">
                  <Image
                    src={subcategory.image || "/place.jpeg"}
                    alt={subcategory.name}
                    width={800}
                    height={500}
                    className="w-full h-60 object-contain"
                    onError={(e) => {
                      e.target.src = "/place.jpeg";
                    }}
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow w-full bg-[#1155CC] text-center">
                  <h3 className="text-sm line-clamp-2 w-full uppercase text-white font-[400]">
                    {subcategory.name}
                  </h3>
                  <p className="text-white text-sm mt-2 opacity-90">
                    {`(${subcategory._count?.products || 0})`} products
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No subcategories found for this category
            </div>
          )}
        </div>
      </div>
    );
  };

  // Only show products if viewMode is 'products'
  const renderProducts = () => (
    <div>
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
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No products found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#111827] text-white py-14">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-bold uppercase flex items-center justify-center gap-1">
              <ChevronRight className="text-orange-500 text-2xl" size={35} />
              {currentSubcategory
                ? decodeURIComponent(currentSubcategory)
                : currentCategory
                ? decodeURIComponent(currentCategory)
                : "All Products"}
            </h1>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-8 py-8">
        {/* Mobile Category Sidebar Toggle Button */}
        <div className="mb-6 flex items-center justify-between md:hidden">
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
              onClick={() => {
                router.push("/");
              }}
            >
              Home
            </span>
            {currentCategory && (
              <>
                <span>/</span>
                <span
                  className="cursor-pointer hover:text-gray-800"
                  onClick={() => {
                    updateUrl({ category: currentCategory });
                    setViewMode("subcategories");
                    setProducts([]);
                  }}
                >
                  {decodeURIComponent(currentCategory).toUpperCase()}
                </span>
              </>
            )}
            {currentSubcategory && (
              <>
                <span>/</span>
                <span className="text-gray-800">
                  {decodeURIComponent(currentSubcategory).toUpperCase()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Desktop Breadcrumb Navigation */}
        <div className="mb-6 hidden md:flex items-center gap-2 text-sm text-gray-600">
          <span
            className="cursor-pointer hover:text-gray-800"
            onClick={() => {
              router.push("/");
            }}
          >
            Home
          </span>
          {currentCategory && (
            <>
              <span>/</span>
              <span
                className="cursor-pointer hover:text-gray-800"
                onClick={() => {
                  updateUrl({ category: currentCategory });
                  setViewMode("subcategories");
                  setProducts([]);
                }}
              >
                {decodeURIComponent(currentCategory).toUpperCase()}
              </span>
            </>
          )}
          {currentSubcategory && (
            <>
              <span>/</span>
              <span className="text-gray-800">
                {decodeURIComponent(currentSubcategory).toUpperCase()}
              </span>
            </>
          )}
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
            ) : (
              <main className="w-full">
                {viewMode === "categories" && renderCategories()}
                {viewMode === "subcategories" && renderSubcategories()}
                {viewMode === "products" && renderProducts()}
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
