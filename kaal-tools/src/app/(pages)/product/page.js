import ProductPage from '@/app/_component/ProductPage'
import React from 'react'

export default function Page({ searchParams }) {
  let category = searchParams.category ? decodeURIComponent(searchParams.category) : undefined;
  let subcategory = searchParams.subcategory ? decodeURIComponent(searchParams.subcategory) : undefined;

  return (
    <ProductPage
      initialCategory={category}
      initialSubCategory={subcategory}
    />
  );
}
