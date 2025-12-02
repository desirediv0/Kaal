import React from "react";

export default function Wrapper({ children, className = "" }) {
  return (
    <div className={`md:max-w-7xl mx-auto py-10 ${className} `}>{children}</div>
  );
}
