import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const Cta = () => {
  return (
    <section className="bg-gray-900 text-white py-16 px-4">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row md:gap-24 items-center justify-between space-y-6 md:space-y-0 md:space-x-12">
        <div className="flex-1 text-white">
          <div className="flex items-center mb-4">

            <h2 className="lg:text-3xl text-2xl text-justify font-extrabold tracking-tight">
            If you wish to become one of our strategic partners to distribute our products we would love to hear from you.
            </h2>
          </div>
          <p className=" text-justify  max-w-xl leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <Link href='/contact' >
            <button
              className="bg-[var(--maincolor)] text-white font-bold py-4 px-8 rounded-lg 
            transition duration-300 ease-in-out transform hover:-translate-y-1 
            shadow-2xl flex items-center justify-center space-x-3 
            group relative overflow-hidden"
            >
              <span className="relative z-10">Get Started Now</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition" />

            </button>
          </Link>

          <div className="text-center text-sm text-gray-400">
            ISO Certified 2025
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;