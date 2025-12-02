import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";

const AdditionalSettings = ({
  seoTitle = "",
  seoDesc = "",
  onSeoTitleChange = () => {},
  onSeoDescChange = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full mt-8 border rounded-lg overflow-hidden">
      <div
        className={`w-full p-4 flex justify-between items-center transition-colors cursor-pointer ${
          isOpen ? "bg-gray-100" : "bg-gray-200"
        }`}
        onClick={toggleAccordion}
      >
        <span className="font-semibold">Additional Settings</span>
        <ChevronDown
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>
      <div
        ref={contentRef}
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
          overflow: "hidden",
          transition: "max-height 0.3s ease-in-out",
        }}
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              placeholder="Enter SEO title"
              value={seoTitle}
              onChange={(e) => onSeoTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDesc">Meta Description</Label>
            <Textarea
              id="seoDesc"
              placeholder="Enter meta description"
              value={seoDesc}
              onChange={(e) => onSeoDescChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalSettings;
