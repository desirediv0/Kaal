import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RenderSearchResultCard = ({ product, handleDelete }) => {
  const { title, slug, categories, subCategories, price, salePrice, image } =
    product;

  return (
    <Card className="mb-4">
      <CardContent className="flex items-center p-4">
        <div className="flex-shrink-0 mr-4">
          {image ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${image}`}
              alt={title}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="w-[60px] h-[60px] bg-gray-200 rounded-md flex items-center justify-center">
              N/A
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold">{title || "Untitled"}</h3>
          <p className="text-sm text-gray-500">
            {categories.map((category) => category.name).join(", ")}
            {subCategories && subCategories.length > 0 && (
              <>
                {" "}
                | {subCategories.map((sub) => sub.subCategory.name).join(", ")}
              </>
            )}
          </p>
          <p className="text-sm">
            {salePrice ? (
              <>
                <span className="text-red-500 font-semibold">
                  ₹{salePrice.toFixed(2)}
                </span>
                <span className="text-sm line-through text-gray-500 ml-2">
                  ₹{price.toFixed(2)}
                </span>
                <span className="text-green-500 font-semibold ml-2">
                  {((1 - salePrice / price) * 100).toFixed(0)}% off
                </span>
              </>
            ) : price ? (
              `₹${price.toFixed(2)}`
            ) : (
              "N/A"
            )}
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <Button asChild size="sm" className="mr-2">
            <Link href={`/dashboard/products/${slug}`}>Edit</Link>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(slug)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenderSearchResultCard;
