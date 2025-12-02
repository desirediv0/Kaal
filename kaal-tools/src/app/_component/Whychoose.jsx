"use client";

import React from "react";
import Image from "next/image";

export default function WhyChooseUs() {
  return (
    <section className="bg-gray-100">
      <div className="flex flex-col lg:flex-row items-start">
        <div className="w-full lg:w-1/2">
          <Image
            src="/msn.jpeg"
            alt="Why choose KAAL TOOLS"
            width={500}
            height={300}
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        <div className="w-full lg:w-1/2 lg:pl-8 p-10">
          <div>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              WHY <span className="nd-logos text-[28px]">KAAL</span><sup>®</sup>
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              <span className="nd-logos text-[14px]">KAAL</span><sup>®</sup> is committed to builders and maintainers - we understand the value of
              time and our tools are made to be efficient and deliver precisely what you
              need them for.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              We are continuously developing new products and expanding our
              comprehensive range of tools to ensure you have the right solution for every
              task at hand.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Each and every product shipped goes through quality check before dispatch.
              We offer customised services as well to meet specific demands for inspection
              procedures and reports, through to unique packaging (other than our
              standard), barcoding or product labelling, laser-marking for point of sale
              presentation.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              With <span className="nd-logos text-[14px]">KAAL</span><sup>®</sup>, you have a manufacturing partner you can rely on - every step of
              the way!!!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}