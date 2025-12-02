import React from "react";
import { Banner } from "./_component/Banner";
import Product from "./_component/Product";
import Whychoose from "./_component/Whychoose";
import Testimonials from "./_component/Testinomials";
import NewProducts from "./_component/NewProducts";
import TopCategories from "./_component/TopCategory";
import { HeroBanner } from "./_component/hero-banner";

const items = [
  {
    image: "/s-1.png",
    link: "/product?category=metalworking%20lathe%20accessories",
    btntext: "Explore Our Range",
    head1: "metalworking",
    head2: "lathe & milling ",
    head3: "accessories",
    bg: "bg-[#ff6402]",
    hover: "hover:bg-[#ff6402]",
  },
  {
    image: "/s-2.png",
    link: "/product?category=woodworking+tools",
    btntext: "Explore Our Range",
    head1: " woodturning ",
    head2: "lathe",
    head3: "accessories",
    bg: "bg-[#aa7540]",
    hover: "hover:bg-[#f5f5f5]",
  },
  {
    image: "/s-3.png",
    link: "/product?category=measuring%20%26%20marking%20tools",
    btntext: "Explore Our Range",
    head1: "measuring",
    head2: "& marking ",
    head3: "tools",
    bg: "bg-[#673532]",
    hover: "hover:bg-[#f5f5f5]",
  },
  {
    image: "/s-4.png",
    link: "/product?category=thread%20repairing%20kits%20%26%20accessories",
    btntext: "Explore Our Range",
    head1: "threading",
    head2: "repairing",
    head3: "kits",
    bg: "bg-[#00cdfc]",
    hover: "hover:bg-[#f5f5f5]",
  },
  {
    image: "/s-5.png",
    link: "/product?category=vises%20%26%20milling%20tables",
    btntext: "Explore Our Range",
    head1: "vises &",
    head2: "milling",
    head3: "tables",
    bg: "bg-[#65999c]",
    hover: "hover:bg-[#f5f5f5]",
  },
];
const items2 = [
  {
    image: "/banner2.png",
  },
];

export default function page() {
  return (
    <>
      <HeroBanner items={items} h={"65vh"} />
      <NewProducts />
      <TopCategories />
      <div className="my-10 md:my-20">
        <Banner items={items2} h={"55vh"} />
      </div>
      {/* <TopBrands /> */}
      <Product activepage="homepage" />
      {/* <Counter /> */}
      <Whychoose />
      {/* <Cta /> */}
      <div className="py-6"></div>
      <Testimonials />
      <div className="py-6"></div>
    </>
  );
}
