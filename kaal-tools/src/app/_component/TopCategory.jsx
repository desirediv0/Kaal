"use client";
import Image from "next/image";
import Link from "next/link";

const encodeCategory = (name) => {
  return encodeURIComponent(name.toLowerCase());
};

const categories = [
  { name: "measuring & marking", image: "/cate/MEASURING.jpg", href: `/product?category=${encodeCategory("measuring & marking tools")}` },
  { name: "hand tools", image: "/cate/HAND-TOOLS.jpg", href: `/product?category=${encodeCategory("hand tools")}` },
  { name: "cutting tools", image: "/cate/CUTTING-TOOLS.jpeg", href: `/product?category=${encodeCategory("cutting tools")}` },
  { name: "rotary tables", image: "/cate/ROTARY-TABLES.jpg", href: `/product?category=${encodeCategory("rotary tables & accessories")}` },
  { name: "indexable tools", image: "/cate/INDEXABLE.jpeg", href: `/product?category=${encodeCategory("indexable tools")}` },
  { name: "vises & milling tables", image: "/cate/VISES.jpg", href: `/product?category=${encodeCategory("vises & milling tables")}` },
  { name: "angle plates", image: "/cate/VEE-BLOCKS.jpeg", href: `/product?category=${encodeCategory("vee blocks & angle plates")}` },
  { name: "boring heads", image: "/cate/BORING-HEADS-&-ACCESSORIES.jpg", href: `/product?category=${encodeCategory("boring heads & accessories")}` },
];

export default function TopCategories() {
  return (
    <section className="py-6 sm:py-8 md:py-12 bg-white">
      <div className="container px-2 sm:px-4 max-w-7xl mx-auto">
        <span className="w-full pb-6 sm:pb-8 md:pb-12 flex flex-col justify-center items-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black uppercase text-center">Product Categories</h1>
          <div className="bg-[var(--maincolor)] w-32 sm:w-40 md:w-44 h-1 rounded-full mt-2"></div>
        </span>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Banner */}
            <div className="w-full lg:w-1/5 h-auto">
              <Link
                href={`/product?category=${encodeCategory("metalworking lathe accessories")}`}
                className="block h-full">
                <div className="relative w-full h-[300px] lg:h-full rounded-lg shadow-md overflow-hidden">
                  <Image
                    src="/cate/METALWORKING-LATHE-ACCESSORIES.jpeg"
                    alt="Metalworking Lathe Accessories"
                    fill
                    sizes="(max-width: 1024px) 100vw, 20vw"
                    className="object-contain"
                    priority
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h2 className="text-white text-base sm:text-lg font-bold uppercase text-center w-full">
                      metalworking lathe accessories
                    </h2>
                  </div>
                </div>
              </Link>
            </div>

            {/* Center Cards */}
            <div className="w-full lg:w-3/5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map((category, index) => (
                  <Link href={category.href} key={index} className="block">
                    <div className="relative aspect-square rounded-lg shadow-md overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 15vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2">
                        <h3 className="text-white text-xs sm:text-sm font-semibold uppercase text-center w-full">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Banner */}
            <div className="w-full lg:w-1/5 h-auto">
              <Link
                href={`/product?category=${encodeCategory("woodworking tools")}`}
                className="block h-full">
                <div className="relative w-full h-[300px] lg:h-full rounded-lg shadow-md overflow-hidden">
                  <Image
                    src="/cate/WOODTURNING-LATHE-ACCESSORIES.jpg"
                    alt="Woodworking Tools"
                    fill
                    sizes="(max-width: 1024px) 100vw, 20vw"
                    className="object-contain"
                    priority
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h2 className="text-white text-base sm:text-lg font-bold uppercase text-center w-full">
                      woodworking tools
                    </h2>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
