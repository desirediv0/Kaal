import React from "react";
import Image from "next/image";
import Link from "next/link";

export const ProductCard = ({ product, onProductClick }) => {
  if (!product) return null;

  return (
    <Link href={`/product/${product.title}`} onClick={onProductClick}>
      <div className="flex items-center gap-4 border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
        <div className="relative w-24 h-24 flex-shrink-0">
          {product.image && (
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-contain"
            />
          )}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold">{product.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {product.shortdesc}
          </p>
        </div>
      </div>
    </Link>
  );
};