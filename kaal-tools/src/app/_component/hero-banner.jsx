"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function HeroBanner({ items }) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const showControls = items.length > 1;

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

  return (
    <div className="w-full relative min-h-[450px] md:min-h-[650px] lg:min-h-[500px]">
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="relative z-10 h-full">
        <Carousel
          plugins={showControls ? [plugin.current] : []}
          className="w-full h-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <CarouselContent className="h-full">
            {items.map((item, index) => (
              <CarouselItem key={index} className="h-full">
                <div className="flex flex-col lg:grid lg:grid-cols-12 h-full items-center pt-8 xl:pr-2  xl:pl-6 pb-8 md:pb-12 lg:pb-0">
                  <div className="w-[500px] lg:p-5 lg:col-span-4 xl:col-span-3 flex flex-col sm:mt-10 xl:mt-[-80px] text-white order-1 mb-2 lg:mb-0 text-center lg:text-start">
                    <h1 className="text-4xl lg:text-5xl  font-semibold text-shadow uppercase break-words">
                      {item.head1}
                    </h1>
                    <h2
                      className={`text-4xl lg:text-5xl ${item.bg} stroke-text bg-clip-text text-transparent font-bold uppercase break-words text-nowrap`}
                    >
                      {item.head2}
                    </h2>
                    <h3 className="text-4xl lg:text-5xl uppercase font-semibold break-words">
                      {item.head3}
                    </h3>
                    {item.btntext && (
                      <Link href={item.link} className="mt-4">
                        <Button
                          className={`${item.bg} hover:${item.bg} shadow-[4px_4px_6px_rgba(255,255,255,0.8)] text-white text-base md:text-xl font-semibold font-sans rounded-none py-2 lg:py-5 capitalize max-w-md md:w-auto lg:mt-8`}
                        >
                          {item.btntext}
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="w-full sm:col-span-4  lg:col-span-8  xl:col-span-9 relative h-[250px] md:h-[450px] lg:h-[450px] order-2 mt-8 lg:mt-2">
                    <div className="w-full h-full relative">
                      <Image
                        src={item.image}
                        alt={`Slide ${index + 1}`}
                        fill
                        className="object-contain md:object-contain lg:object-contain"
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
                        quality={90}
                      />
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {showControls && (
            <>
              <CarouselPrevious className="absolute text-white left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-none z-20" />
              <CarouselNext className="absolute text-white right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-none z-20" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
