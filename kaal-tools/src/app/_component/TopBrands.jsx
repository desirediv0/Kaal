import React from "react";
import Image from "next/image";

const TopBrands = () => {
  const brands = [
    {
      name: "Brand 1",
      logo: "/b1.jpg",
      alt: "Brand 1 logo",
    },
    {
      name: "Brand 2",
      logo: "/b2.png",
      alt: "Brand 2 logo",
    },
    {
      name: "Brand 3",
      logo: "/b3.png",
      alt: "Brand 3 logo",
    },
    {
      name: "Brand 4",
      logo: "/b4.webp",
      alt: "Brand 4 logo",
    },
    {
      name: "Brand 5",
      logo: "/b1.jpg",
      alt: "Brand 5 logo",
    },
    {
      name: "Brand 6",
      logo: "/b2.png",
      alt: "Brand 6 logo",
    },
  ];

  return (
    <section className="py-16 bg-[var(--maincolor)]">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className=" text-4xl  mb-4 text-white">Top Brands</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {brands.map((brand, index) => (
            <div key={index} className="w-full relative">
              <div className="relative w-full h-full flex items-center justify-center p-4 bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out">
                <Image
                  src={brand.logo}
                  alt={brand.alt}
                  width={120}
                  height={60}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopBrands;
