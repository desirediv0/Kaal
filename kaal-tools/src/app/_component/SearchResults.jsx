"use client";
import React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export const SearchResults = ({ results, onProductClick, isLoading, onClearSearch }) => {
  const router = useRouter();

  const handleProductClick = (slug) => {
    onClearSearch?.();
    onProductClick?.();
    router.push(`/product/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-full md:max-w-[60%] min-w-[320px] bg-white shadow-lg rounded-b-lg mt-1 p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (!Array.isArray(results) || results.length === 0) return null;

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 w-full md:max-w-[60%] min-w-[320px] bg-white shadow-lg rounded-b-lg mt-1 max-h-[80vh] overflow-y-auto z-50">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-4">
        {results.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product.slug)}
            className="flex flex-col w-full bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 overflow-hidden"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.title}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="p-3 text-center w-full">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                {product.title}
              </h3>
              {product.category && (
                <p className="text-xs text-gray-500 capitalize bg-gray-50 px-2 py-1 rounded-full inline-block">
                  {product.category}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};