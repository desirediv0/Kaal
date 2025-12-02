import Image from "next/image";
import Link from "next/link";
import React from "react";

const ProductCard = ({
  title,
  saleprice,
  image,
  href,
  tag,
  className,
  textClass,
}) => {
  const getImageUrl = (image) => {
    if (!image) return "/place.jpeg";
    if (image.startsWith("http")) return image;
    return image.startsWith("/") ? image : `/${image}`;
  };

  return (
    <Link
      href={href}
      className="block hover:scale-105 transform  transition-transform duration-300"
    >
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative h-full flex flex-col">
        {saleprice ? (
          <div className="absolute -left-8 top-4 rotate-[-45deg] bg-orange-500 text-white px-10 py-1 shadow-lg z-10">
            <span className="text-sm font-semibold">{tag || "SALE"}</span>
          </div>
        ) : null}
        <div className="relative flex-shrink-0">
          <Image
            className="w-full h-60 object-contain"
            alt={title}
            width={800}
            height={500}
            src={getImageUrl(image)}
          />
        </div>
        <div className={`p-4 flex flex-col flex-grow w-full ${className}`}>
          <h2
            className={`text-sm  line-clamp-2 w-full uppercase text-center text-black ${textClass}`}
          >
            {title}
          </h2>
          {/* <div className="mt-2">
            {saleprice && (
              <span className="text-red-500 font-semibold mr-2">
                {formatPrice(saleprice)}
              </span>
            )}
            <span className={`${saleprice ? 'line-through text-gray-500' : 'text-black font-semibold'}`}>
              {formatPrice(price)}
            </span>
          </div> */}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
