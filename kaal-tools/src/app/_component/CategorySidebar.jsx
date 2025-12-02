"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  getAllCategoriesAndSubCategories,
  getSubcategoriesByCategory,
  getSubcategoryInfoByName,
} from "@/Api";

export default function CategorySidebar({ isOpen, onClose }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categorySubcategories, setCategorySubcategories] = useState({});

  const currentCategory = searchParams.get("category");
  const currentSubcategory = searchParams.get("subcategory");

  // Check if we're on a subcategory page
  const isSubcategoryPage = pathname.includes("/product/subcategory/");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categoryData = await getAllCategoriesAndSubCategories();
        if (categoryData.success) {
          const filteredCategories = categoryData.data.filter(
            (cat) => cat.name !== "Uncategorized" && cat.name !== "All"
          );
          setCategories(filteredCategories);

          // Handle different scenarios for auto-expanding categories
          if (isSubcategoryPage) {
            // We're on a subcategory page, need to find the parent category
            const slug = pathname.split("/product/subcategory/")[1];
            if (slug) {
              const decodedSlug = decodeURIComponent(slug);
              await handleSubcategoryPage(decodedSlug, filteredCategories);
            }
          } else if (currentCategory) {
            // We're on a category page with query params
            const categoryToExpand = filteredCategories.find(
              (cat) => cat.name.toLowerCase() === currentCategory
            );
            if (categoryToExpand) {
              setExpandedCategory(currentCategory);
              await fetchSubcategoriesForCategory(categoryToExpand.name);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [currentCategory, pathname, isSubcategoryPage]);

  const handleSubcategoryPage = async (subcategoryName, filteredCategories) => {
    try {
      const subcategoryInfo = await getSubcategoryInfoByName(subcategoryName);

      if (subcategoryInfo.success && subcategoryInfo.data) {
        const parentCategory = subcategoryInfo.data.category;
        if (parentCategory) {
          const categoryKey = parentCategory.name.toLowerCase();
          setExpandedCategory(categoryKey);

          // Fetch subcategories for the parent category
          await fetchSubcategoriesForCategory(parentCategory.name);
        }
      } else {
        // Try to find the category by searching through all categories
        for (const category of filteredCategories) {
          const subcategoryData = await getSubcategoriesByCategory(
            category.name
          );
          if (subcategoryData.success && subcategoryData.data.subcategories) {
            const foundSubcategory = subcategoryData.data.subcategories.find(
              (sub) => {
                const normalizedSubName = sub.name.toLowerCase().trim();
                const normalizedSearchName = subcategoryName
                  .toLowerCase()
                  .trim()
                  .replace(/-/g, " ");
                return (
                  normalizedSubName === normalizedSearchName ||
                  normalizedSubName.includes(normalizedSearchName) ||
                  normalizedSearchName.includes(normalizedSubName)
                );
              }
            );

            if (foundSubcategory) {
              const categoryKey = category.name.toLowerCase();
              setExpandedCategory(categoryKey);
              await fetchSubcategoriesForCategory(category.name);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error handling subcategory page:", error);
    }
  };

  const fetchSubcategoriesForCategory = async (categoryName) => {
    const categoryKey = categoryName.toLowerCase();

    if (!categorySubcategories[categoryKey]) {
      try {
        const subcategoryData = await getSubcategoriesByCategory(categoryName);
        if (subcategoryData.success) {
          setCategorySubcategories((prev) => ({
            ...prev,
            [categoryKey]: subcategoryData.data.subcategories,
          }));
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    }
  };

  const toggleCategory = async (categoryName) => {
    const categoryKey = categoryName.toLowerCase();

    // If clicking the same category, close it
    if (expandedCategory === categoryKey) {
      setExpandedCategory(null);
    } else {
      // If clicking a different category, close the previous one and open the new one
      setExpandedCategory(categoryKey);

      // Fetch subcategories if not already loaded
      await fetchSubcategoriesForCategory(categoryName);
    }
  };

  const handleCategoryClick = async (categoryName) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    newParams.delete("subcategory");
    newParams.set("category", categoryName.toLowerCase());
    router.push(`/product?${newParams.toString()}`);

    // Auto-expand the clicked category
    const categoryKey = categoryName.toLowerCase();
    setExpandedCategory(categoryKey);

    // Fetch subcategories if not already loaded
    await fetchSubcategoriesForCategory(categoryName);

    // Don't close sidebar - keep it open
  };

  const handleSubcategoryClick = (subcategoryName) => {
    // Navigate to the dedicated subcategory page
    const encodedSubcategory = encodeURIComponent(
      subcategoryName.toLowerCase()
    );
    router.push(`/product/subcategory/${encodedSubcategory}`);
    // Don't close sidebar - keep it open
  };

  const isCategoryActive = (categoryName) => {
    return currentCategory === categoryName.toLowerCase();
  };

  const isSubcategoryActive = (subcategoryName) => {
    // Check if subcategory is active via query params
    const isActiveViaParams =
      currentSubcategory === encodeURIComponent(subcategoryName.toLowerCase());

    // Check if subcategory is active via pathname (subcategory page)
    if (isSubcategoryPage) {
      const slug = pathname.split("/product/subcategory/")[1];
      if (slug) {
        const decodedSlug = decodeURIComponent(slug);
        const normalizedSubcategoryName = subcategoryName.toLowerCase().trim();
        const normalizedSlug = decodedSlug
          .toLowerCase()
          .trim()
          .replace(/-/g, " ")
          .replace(/\s+/g, " ");

        // Try multiple matching strategies with case-insensitive comparison
        const exactMatch = normalizedSubcategoryName === normalizedSlug;
        const partialMatch =
          normalizedSubcategoryName.includes(normalizedSlug) ||
          normalizedSlug.includes(normalizedSubcategoryName);
        const cleanMatch =
          normalizedSubcategoryName.replace(/[^a-z0-9\s]/g, "").trim() ===
          normalizedSlug.replace(/[^a-z0-9\s]/g, "").trim();

        // Additional check for URL-encoded spaces
        const urlEncodedMatch =
          encodeURIComponent(subcategoryName.toLowerCase()) === slug ||
          encodeURIComponent(
            subcategoryName.toLowerCase().replace(/\s+/g, " ")
          ) === slug;

        // Case-insensitive comparison for the original names
        const caseInsensitiveMatch =
          subcategoryName.toLowerCase() === decodedSlug.toLowerCase() ||
          subcategoryName.toLowerCase().replace(/\s+/g, " ") ===
            decodedSlug.toLowerCase().replace(/\s+/g, " ");

        return (
          exactMatch ||
          partialMatch ||
          cleanMatch ||
          urlEncodedMatch ||
          caseInsensitiveMatch
        );
      }
    }

    return isActiveViaParams;
  };

  if (loading) {
    return (
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Categories</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 md:w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Filter by Category</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          <div className="p-4">
            {categories.map((category) => {
              const categoryKey = category.name.toLowerCase();
              const isExpanded = expandedCategory === categoryKey;
              const isActive = isCategoryActive(category.name);
              const subcategories = categorySubcategories[categoryKey] || [];

              return (
                <div key={category.id} className="mb-2">
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    <span className="font-medium text-sm uppercase">
                      {category.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.name);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && subcategories.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1">
                      {subcategories.map((subcategory) => {
                        const isSubActive = isSubcategoryActive(
                          subcategory.name
                        );
                        return (
                          <div
                            key={subcategory.id}
                            className={`p-2 rounded cursor-pointer transition-colors text-sm ${
                              isSubActive
                                ? "bg-orange-50 text-orange-600 border border-orange-100"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() =>
                              handleSubcategoryClick(subcategory.name)
                            }
                          >
                            <span className="uppercase">
                              {subcategory.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden">
          <button
            onClick={onClose}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
