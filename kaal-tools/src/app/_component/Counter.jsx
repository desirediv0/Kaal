import React from 'react';

const Counter = () => {
    const stats = [
        { number: "10+", label: "YEAR OF EXPERIENCE" },
        { number: "800+", label: "PRODUCTS" },
        { number: "20+", label: "GLOBAL DISTRIBUTORS" },
        { number: "10+", label: "SERVICE OVER COUNTRIES" }
    ];

    return (
        <div className="w-full  bg-[var(--maincolor)] text-white py-16">
            <div className="max-w-7xl mx-auto  px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center justify-center text-center relative"
                        >
                            {/* Add separator line except for the last item */}
                            {index < stats.length - 1 && (
                                <div className="hidden md:block absolute right-0 top-1/4 h-2/3 w-px bg-gray-200" />
                            )}

                            <span className="text-5xl  mb-2">
                                {stat.number}
                            </span>
                            <span className="text-sm md:text-base  font-medium tracking-wider">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Counter;