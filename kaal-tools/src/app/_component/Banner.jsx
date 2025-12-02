"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Custom hook to detect screen size
function useScreenSize() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isMobile;
}

export function Banner({ items, h }) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );
  const isMobile = useScreenSize();

  const showControls = items.length > 1;

  // Create handlers to ensure proper autoplay control
  const handleMouseEnter = React.useCallback(() => {
    if (showControls && plugin.current) {
      plugin.current.stop();
    }
  }, [showControls]);

  const handleMouseLeave = React.useCallback(() => {
    if (showControls && plugin.current) {
      plugin.current.play();
    }
  }, [showControls]);

  // Function to get responsive image source
  const getResponsiveImage = (item) => {
    // If the item has a specific mobile image, use it
    if (isMobile && item.mobileImage) {
      return item.mobileImage;
    }

    // If the item has a specific desktop image, use it
    if (!isMobile && item.desktopImage) {
      return item.desktopImage;
    }

    // Default responsive behavior - use smbanner.png for mobile, banner2.png for desktop
    if (isMobile) {
      return "/smbanner.png";
    } else {
      return "/banner2.png";
    }
  };

  // Function to get responsive height
  const getResponsiveHeight = () => {
    if (h) {
      // If custom height is provided, use it
      return h;
    }
    // Default responsive heights
    return isMobile ? "50vh" : "55vh";
  };

  return (
    <div className="w-full overflow-hidden relative">
      <Carousel
        plugins={showControls ? [plugin.current] : []}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem key={index}>
              {item.link ? (
                <Link href={item.link} className="block w-full h-full">
                  <div
                    className="relative w-full cursor-pointer"
                    style={{ height: getResponsiveHeight() }}
                  >
                    <Image
                      src={getResponsiveImage(item)}
                      alt={`Banner image ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                      style={{
                        objectFit: "cover",
                      }}
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 sm:p-4">
                      <section className="w-full sm:w-4/5 md:w-2/3 px-2 sm:px-0">
                        <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 text-center select-none leading-tight">
                          {item.heading ? item.heading : ""}
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg mb-2 sm:mb-4 text-center select-none leading-relaxed">
                          {item.shortdesc ? item.shortdesc : ""}
                        </p>
                      </section>
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  className="relative w-full"
                  style={{ height: getResponsiveHeight() }}
                >
                  <Image
                    src={getResponsiveImage(item)}
                    alt={`Banner image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                    style={{
                      objectFit: "cover",
                    }}
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 sm:p-4">
                    <section className="w-full sm:w-4/5 md:w-2/3 px-2 sm:px-0">
                      <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 text-center select-none leading-tight">
                        {item.heading}
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg mb-2 sm:mb-4 text-center select-none leading-relaxed">
                        {item.shortdesc}
                      </p>
                    </section>
                  </div>
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {showControls && (
          <>
            <CarouselPrevious className="absolute text-white left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-none bg-black/20 hover:bg-black/40" />
            <CarouselNext className="absolute text-white right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-none bg-black/20 hover:bg-black/40" />
          </>
        )}
      </Carousel>
    </div>
  );
}
