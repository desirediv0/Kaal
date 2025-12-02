"use client";
import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import SearchBar from "./SearchBar";
import { SearchResults } from "./SearchResults";
import { getAllCategoriesAndSubCategories, searchProducts } from "@/Api";
import MegaMenu from "./mega.menu";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
    setIsMobileMenuOpen(false);
  }, []);

  const handleSearch = useCallback(
    async (query) => {
      if (!query?.trim()) {
        clearSearch();
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchProducts(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [clearSearch]
  );

  const handleMegaMenuOpen = useCallback(
    (isOpen) => {
      setIsMegaMenuOpen(isOpen);
      if (isOpen) {
        clearSearch();
      }
    },
    [clearSearch]
  );

  const isActive = (path) => pathname === path;

  const handleMobileClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getAllCategoriesAndSubCategories();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        } else {
          console.warn("Invalid categories data received:", result);
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 relative">
            <span className="absolute top-5 md:top-7 right-0 md:right-2 text-xs font-medium">
              ®
            </span>
            <Image
              src="/logo.webp"
              alt="Logo"
              width={400}
              height={100}
              className="w-auto h-20 md:h-28"
              priority
            />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-grow max-w-2xl mx-auto px-4">
            <SearchBar
              onSearch={handleSearch}
              isSearching={isSearching}
              onClearSearch={clearSearch}
            />
            <SearchResults
              results={searchResults}
              onProductClick={clearSearch}
              onClearSearch={clearSearch}
              isLoading={isSearching}
            />
          </div>

          {/* Desktop Contact */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="tel:+918800199820"
              className="flex items-center gap-2 hover:text-orange-500 transition-colors text-lg"
            >
              <Phone className="h-5 w-5" />
              <span>+91 8800199820</span>
            </a>
            <a
              href="https://wa.me/918800199820"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba57] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaWhatsapp className="h-5 w-5" />
              <span>Get Quote</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-t bg-orange-500">
        <div className="container mx-auto px-4">
          <nav className="hidden md:block">
            <ul className="flex items-center justify-center gap-6">
              <li>
                <Link
                  href="/"
                  className={`py-1 px-4 transition-colors font-bold text-sm ${
                    isActive("/")
                      ? "text-black font-bold"
                      : "text-white hover:text-gray-100"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className={`py-1 px-4 transition-colors font-bold text-sm ${
                    isActive("/about")
                      ? "text-black font-bold"
                      : "text-white hover:text-gray-100"
                  }`}
                >
                  About
                </Link>
              </li>
              <li>
                <MegaMenu
                  isMobile={false}
                  categories={categories}
                  onMenuToggle={handleMegaMenuOpen}
                />
              </li>
              <li>
                <Link
                  href="/contact"
                  className={`py-1 px-4 transition-colors font-bold text-sm ${
                    isActive("/contact")
                      ? "text-black font-bold"
                      : "text-white hover:text-gray-100"
                  }`}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-white z-50 ${
          isMobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div className="h-full overflow-y-auto">
          {/* Mobile Header with Close Button */}
          <div className="sticky top-0 bg-white border-b z-20 flex items-center justify-between p-4">
            <h2 className="text-lg font-bold"></h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="p-4 border-b bg-white">
            <div className="relative mx-auto max-w-xl">
              <SearchBar
                onSearch={handleSearch}
                isSearching={isSearching}
                onClearSearch={clearSearch}
              />
              <SearchResults
                results={searchResults}
                onProductClick={clearSearch}
                onClearSearch={clearSearch}
                isLoading={isSearching}
              />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="py-2">
            <ul className="space-y-2">
              <li className="border-b">
                <Link
                  href="/"
                  onClick={handleMobileClick}
                  className={`block px-4 py-2 transition-colors text-base font-bold ${
                    isActive("/")
                      ? "text-black font-bold"
                      : "hover:text-orange-500"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li className="border-b">
                <Link
                  href="/about"
                  onClick={handleMobileClick}
                  className={`block px-4 py-2 transition-colors text-base font-bold ${
                    isActive("/about")
                      ? "text-black font-bold"
                      : "hover:text-orange-500"
                  }`}
                >
                  About
                </Link>
              </li>
              <li className="border-b">
                <MegaMenu
                  isMobile={true}
                  categories={categories}
                  handleMobileClick={handleMobileClick}
                />
              </li>
              <li className="border-b">
                <Link
                  href="/contact"
                  onClick={handleMobileClick}
                  className={`block px-4 py-2 transition-colors text-base font-bold ${
                    isActive("/contact")
                      ? "text-black font-bold"
                      : "hover:text-orange-500"
                  }`}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile Contact */}
          <div className="p-4 space-y-4 border-t sticky bottom-0 bg-white">
            <a
              href="tel:+918800199820"
              className="flex items-center gap-2 hover:text-orange-500 transition-colors"
            >
              <Phone className="h-5 w-5" />
              <span>+91 8800199820</span>
            </a>
            <a
              href="https://wa.me/918800199820"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba57] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaWhatsapp className="h-5 w-5" />
              <span>Get Quote on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
