"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2Icon, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProducts } from "@/Api";
import Wrapper from "./Wrapper";
import ProductCard from "./product-card";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function NewProducts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const autoplay = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
    },
    [autoplay.current]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleMouseEnter = useCallback(() => {
    if (autoplay.current && autoplay.current.stop) {
      autoplay.current.stop();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (autoplay.current && autoplay.current.play) {
      autoplay.current.play();
    }
  }, []);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const featuredProducts = data.slice(0, 20);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProducts();
        setData(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, []);

  return (
    <section className="w-full bg-gray-100 py-12">
      <Wrapper>
        <div className="w-full pb-12 flex flex-col justify-center items-center">
          <h1 className="text-4xl font-bold text-black uppercase">
            New Arrivals
          </h1>
          <span className="bg-orange-500 w-44 h-1 rounded-full mt-4"></span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center w-full h-64">
            <Loader2Icon className="h-12 w-12 animate-spin text-orange-500" />
            <span className="ml-4 text-xl font-medium text-black">
              Loading...
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              className="absolute left-0 md:-left-0 top-1/2 -translate-y-1/2 z-10 
                     bg-white/80 hover:bg-white p-2 rounded-full shadow-lg 
                     transition-all duration-300 hover:scale-110"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4 md:h-6 md:w-6 text-gray-800" />
            </button>

            {/* Carousel */}
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {featuredProducts?.map((item, index) => (
                  <div
                    key={index}
                    className="pl-2 md:pl-4 min-w-0 
                      flex-[0_0_100%]        /* Mobile: 1 item */
                      sm:flex-[0_0_50%]      /* Small: 2 items */
                      md:flex-[0_0_33.333%]  /* Medium: 3 items */
                      lg:flex-[0_0_20%]      /* Large: 5 items */
                      xl:flex-[0_0_20%]      /* XL: 5 items */"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <ProductCard
                      title={item.title}
                      price={item.price}
                      // saleprice={item.saleprice}
                      image={item.image}
                      tag={"NEW"}
                      href={item.href}
                      className={"h-20"}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              className="absolute right-0 md:-right-0 top-1/2 -translate-y-1/2 z-10 
                     bg-white/80 hover:bg-white p-2 rounded-full shadow-lg 
                     transition-all duration-300 hover:scale-110"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-gray-800" />
            </button>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6 overflow-x-hidden px-2">
              {featuredProducts?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    selectedIndex === index
                      ? "bg-orange-500 scale-110"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </Wrapper>
    </section>
  );
}
