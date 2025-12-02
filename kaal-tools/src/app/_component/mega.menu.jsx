import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MegaMenu({
  isMobile,
  categories,
  handleMobileClick,
  onMenuToggle,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Ensure categories is always an array and filter out unwanted categories
  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(
        (cat) => cat.name !== "Uncategorized" && cat.name !== "All"
      )
    : [];

  // Click outside handler
  useEffect(() => {
    if (!isMobile) {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobile]);

  useEffect(() => {
    onMenuToggle?.(isOpen);
  }, [isOpen, onMenuToggle]);

  const handleClick = () => {
    setIsOpen(false);
    handleMobileClick?.();
  };

  const getCategoryUrl = (category) => {
    // Format the category name for URL
    const formattedName = category.name.toLowerCase();

    // Use encodeURIComponent for proper encoding of special characters
    return `/product?category=${encodeURIComponent(formattedName)}`;
  };

  const getSubCategoryUrl = (subCategory) => {
    // Format the subcategory name for URL
    const formattedName = subCategory.name.toLowerCase();
    // Use encodeURIComponent for proper encoding of special characters
    return `/product/subcategory/${encodeURIComponent(formattedName)}`;
  };

  // Function to get limited subcategories
  const getLimitedSubcategories = (subcategories) => {
    if (!subcategories || subcategories.length <= 5) {
      return { displayItems: subcategories || [], hasMore: false };
    }

    return {
      displayItems: subcategories.slice(0, 5),
      hasMore: true,
    };
  };

  // Desktop menu
  if (!isMobile) {
    return (
      <div
        ref={menuRef}
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 py-2 px-4 text-sm font-bold text-white hover:text-gray-100 transition-colors"
        >
          Products
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            className="fixed top-[145px] left-0 right-0 mx-auto w-full max-w-7xl bg-white shadow-xl rounded-lg 
              p-4 md:p-6 z-50"
            style={{
              maxHeight: "calc(100vh - 160px)",
              margin: "0 auto",
            }}
          >
            <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-y-auto max-h-[calc(100vh-180px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredCategories.map((category) => {
                  const { displayItems, hasMore } = getLimitedSubcategories(
                    category.subCategories
                  );

                  return (
                    <div key={category.id} className="min-w-0">
                      <Link
                        href={getCategoryUrl(category)}
                        onClick={handleClick}
                        className="font-semibold text-sm text-black hover:text-orange-600 block uppercase truncate"
                      >
                        {category.name}
                      </Link>
                      {displayItems?.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {displayItems.map((subCategory) => (
                            <li key={subCategory.id}>
                              <Link
                                href={getSubCategoryUrl(subCategory)}
                                onClick={handleClick}
                                className="text-gray-700 hover:text-orange-600 transition-colors text-sm block py-1 uppercase truncate"
                              >
                                {subCategory.name}
                              </Link>
                            </li>
                          ))}

                          {hasMore && (
                            <li className="pt-1">
                              <Link
                                href={getCategoryUrl(category)}
                                onClick={handleClick}
                                className="text-orange-600 hover:text-orange-700 font-bold flex items-center text-sm uppercase transition-colors"
                              >
                                Explore More{" "}
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="h-6"></div> {/* Bottom spacing */}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mobile menu
  return (
    <div className="w-full">
      <button
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          onMenuToggle?.(newState);
        }}
        className="flex items-center justify-between w-full py-3 px-4 text-base font-bold"
      >
        <span>Products</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50 bg-gray-50`}
        style={{
          maxHeight: isOpen ? "calc(100vh - 120px)" : "0",
          transition: "max-height 0.3s ease-in-out",
          overflowY: isOpen ? "auto" : "hidden",
        }}
      >
        <div className="py-2">
          {filteredCategories.map((category) => {
            const { displayItems, hasMore } = getLimitedSubcategories(
              category.subCategories
            );

            return (
              <div key={category.id} className="border-b last:border-b-0">
                <Link
                  href={getCategoryUrl(category)}
                  onClick={handleClick}
                  className="block px-4 py-3 font-semibold text-gray-900 hover:text-orange-600 hover:bg-gray-100 uppercase"
                >
                  {category.name}
                </Link>
                {displayItems?.length > 0 && (
                  <ul className="bg-white border-t border-gray-100 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {displayItems.map((subCategory) => (
                      <li key={subCategory.id}>
                        <Link
                          href={getSubCategoryUrl(subCategory)}
                          onClick={handleClick}
                          className="block py-3 px-8 text-gray-600 hover:text-orange-600 hover:bg-gray-50 uppercase text-sm transition-colors"
                        >
                          {subCategory.name}
                        </Link>
                      </li>
                    ))}

                    {hasMore && (
                      <li>
                        <Link
                          href={getCategoryUrl(category)}
                          onClick={handleClick}
                          className=" py-3 px-8 text-orange-600 hover:text-orange-700 font-bold flex items-center text-sm uppercase transition-colors"
                        >
                          Explore More <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="h-6"></div> {/* Bottom spacing for mobile */}
        </div>
      </div>
    </div>
  );
}
