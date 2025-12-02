"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts, fetchSalers } from "@/Api";
import { Loader2Icon } from "lucide-react";
import Wrapper from "./Wrapper";
import ProductCard from "./product-card";

export default function Product({ activepage = "product" }) {
  const [Data, setData] = useState({
    products: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1
  });

  const [Loading, setLoading] = useState(true);

  const FeaturedProduct = activepage === "homepage" && (Array.isArray(Data) ? Data : Data.products);

  useEffect(() => {
    const Products = async () => {
      try {

        const saleData = await fetchSalers();


        // Handle both response types
        if (Array.isArray(saleData)) {
          setData(saleData);
        } else {
          setData(saleData);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    Products();
  }, []);

  return (
    <Wrapper>
      <span className="w-full pb-12 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-black uppercase">
          {activepage === "homepage" ? "Top Sellers" : ""}
        </h1>
        {activepage === "homepage" && (
          <div className="bg-[var(--maincolor)] w-44 h-1 rounded-full mt-2"></div>
        )}
      </span>
      {Loading ? (
        <div className="flex justify-center items-center w-full h-screen">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg font-medium">Loading...</span>
        </div>
      ) : (
        <div className="grid relative grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 p-4 md:p-2">
          {FeaturedProduct?.map((items, index) => (
            <ProductCard
              key={index}
              price={items.price}
              // saleprice={items.saleprice}
              href={items.href}
              image={items.image}
              title={items.title}
              tag={"POPULAR"}
            />
          ))}
        </div>
      )}
      {activepage === "homepage" && (
        <div className="w-full text-center pt-8">
          <Link href="/product">
            <button className="bg-[var(--maincolor)] text-white border-0 mt-3 py-3 px-8 rounded-lg">
              View All Products
            </button>
          </Link>
        </div>
      )}
    </Wrapper>
  );
}