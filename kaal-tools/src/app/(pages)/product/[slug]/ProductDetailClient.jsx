"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import {
  CheckCircleIcon,
  ChevronRight,
  Loader2Icon,
  Mail,
  PenToolIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=No+Image";
const AUTO_SCROLL_INTERVAL = 3000;

const getImageUrl = (filename) => {
  if (!filename) return FALLBACK_IMAGE;
  if (filename.startsWith("http")) return filename;
  return `https://${process.env.NEXT_PUBLIC_SPACES_BUCKET}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${filename}`;
};

export default function ProductDetailClient({ initialProduct }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product] = useState(initialProduct);
  const [mainImage, setMainImage] = useState(
    initialProduct?.image || FALLBACK_IMAGE
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });

  const updateUrl = (params) => {
    const newParams = new URLSearchParams(searchParams.toString());
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

  const productFeatures = [
    {
      icon: <ShieldCheckIcon className="w-6 h-6 text-[var(--maincolor)]" />,
      text: "Premium Quality Assured",
    },
    {
      icon: <PenToolIcon className="w-6 h-6 text-[var(--maincolor)]" />,
      text: "Professional Grade Tools",
    },
  ];

  // Handle image array
  const allImages = useMemo(() => {
    if (!product) return [FALLBACK_IMAGE];

    const images = [];
    if (product.image) {
      images.push(product.image);
    }
    if (product.images?.length > 0) {
      const additionalImages = product.images.map((img) =>
        getImageUrl(img.url)
      );
      images.push(...additionalImages);
    }

    return images.length > 0 ? images : [FALLBACK_IMAGE];
  }, [product]);

  // Auto scroll effect for images
  useEffect(() => {
    if (!allImages.length || allImages.length === 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentImageIndex + 1) % allImages.length;
      setCurrentImageIndex(nextIndex);
      setMainImage(allImages[nextIndex]);
      emblaApi?.scrollTo(nextIndex);
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [allImages, currentImageIndex, emblaApi]);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback(
    (image, index) => {
      setMainImage(image);
      setCurrentImageIndex(index);
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const noSelectClass = "select-none pointer-events-none user-select-none";

  const preventImageDownload = (e) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    const disableRightClick = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2 min-w-max">
            <div className="flex items-center gap-2">
              {product.categories?.map((cat) => (
                <button
                  key={cat.categoryId}
                  onClick={() => updateUrl({ category: cat.category.name })}
                  className={`px-3 py-1 text-sm font-bold whitespace-nowrap
                    ${cat.active ? "text-[var(--maincolor)]" : "text-gray-600 hover:text-[var(--maincolor)]"}
                    transition-all uppercase`}
                >
                  {cat.category.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {product.subCategories?.length > 0 &&
                product.subCategories.map((subCat) => (
                  <button
                    key={subCat.subCategoryId}
                    onClick={() =>
                      updateUrl({ subcategory: subCat.subCategory.name })
                    }
                    className={`px-2 py-1 text-sm font-medium flex items-center whitespace-nowrap
                      ${subCat.active ? "text-[var(--maincolor)]" : "text-gray-500 hover:text-[var(--maincolor)]"}
                      transition-all uppercase`}
                  >
                    <span className="text-gray-400 mr-2">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                    {subCat.subCategory.name}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Main Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white max-h-[500px] w-full">
              <Image
                src={mainImage || "/placeholder.svg"}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className={`object-contain p-4 ${noSelectClass}`}
                onError={() => setMainImage(FALLBACK_IMAGE)}
                onContextMenu={preventImageDownload}
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
                loading="eager"
                style={{ WebkitUserSelect: "none", userSelect: "none" }}
              />
            </div>

            {allImages.length > 1 && (
              <Carousel className="w-full max-w-xs mx-auto" ref={emblaRef}>
                <CarouselContent>
                  {allImages.map((image, index) => (
                    <CarouselItem key={index} className="basis-1/3">
                      <div className="p-1">
                        <Card
                          className={`hover:shadow-md transition-all duration-300 cursor-pointer ${
                            mainImage === image ? "ring-2 ring-[var(--maincolor)]" : ""
                          }`}
                        >
                          <CardContent className="flex aspect-square relative p-0">
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`${product.title} - Image ${index + 1}`}
                              fill
                              className="rounded-md object-cover hover:opacity-80 transition-opacity duration-300"
                              onClick={() => handleThumbnailClick(image, index)}
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                              onContextMenu={preventImageDownload}
                              draggable="false"
                              onDragStart={(e) => e.preventDefault()}
                              style={{
                                WebkitUserSelect: "none",
                                userSelect: "none",
                              }}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl lg:text-3xl font-[500] text-gray-600 mb-3 uppercase break-words">
              {product.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:shadow-md transition-all"
                >
                  {feature.icon}
                  <span className="text-gray-700 text-sm sm:text-base">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg overflow-hidden text-gray-500 text-sm leading-relaxed">
              <div
                className="overflow-x-auto prose prose-sm max-w-none prose-p:text-gray-500 prose-strong:text-gray-600 prose-a:text-[var(--maincolor)]"
                dangerouslySetInnerHTML={{ __html: product.shortDesc }}
              />
            </div>

            <Link href={`/contact?subject=${encodeURIComponent(product.title)}`}>
              <button className="flex items-center justify-center w-full gap-2 px-6 sm:px-8 py-3 sm:py-4 text-white bg-[var(--maincolor)] rounded-lg hover:opacity-90 transition-all text-base sm:text-lg font-medium">
                <Mail className="w-5 h-5" />
                Enquire Now
              </button>
            </Link>
          </div>
        </div>

        {product.description && (
          <div className="mt-10 w-full">
            <div className="flex items-center gap-2 border-b mb-4">
              <CheckCircleIcon className="w-6 h-6 text-[var(--maincolor)]" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 pb-3">
                Description
              </h2>
            </div>
            <div className="bg-slate-50/90 p-4 md:p-6 rounded-xl border border-slate-200/80 overflow-hidden w-full shadow-sm">
              <div
                className="product-html-from-editor product-description-tables product-table-scroll w-full text-slate-800 leading-relaxed text-[15px] md:text-[16px] antialiased [&_a]:text-[var(--maincolor)] [&_a]:underline [&_a]:font-medium"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
