export const fetchProducts = async () => {
  try {
    const response = await fetch("/product.json");
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
export const fetchSalers = async () => {
  try {
    const response = await fetch("/saler.json");
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const searchProducts = async (query) => {
  try {
    if (!query?.trim()) return [];

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/product/user-search?q=${encodeURIComponent(query.trim())}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    // Return the message array which contains products
    return data.success && Array.isArray(data.message) ? data.message : [];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};

export const getAllCategoriesAndSubCategories = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`);
    const data = await response.json();

    // Handle the new paginated response structure
    if (data.success && data.data && data.data.categories) {
      return {
        success: true,
        data: data.data.categories, // Return just the categories array
      };
    }

    // Fallback for old structure or error
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      data: [],
    };
  }
};

export const getSubcategoriesByCategory = async (categoryName) => {
  try {
    const encodedCategory = encodeURIComponent(
      categoryName.toLowerCase().trim()
    );
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subcategory/by-category?category=${encodedCategory}`,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching subcategories by category:", error);
    return {
      success: false,
      data: { subcategories: [] },
      message: error.message,
    };
  }
};

export const getSubcategoryInfoByName = async (subcategoryName) => {
  try {
    // Use the new public endpoint for getting subcategory info by name
    const encodedName = encodeURIComponent(subcategoryName);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subcategory/info/${encodedName}`,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle the API response structure where data is nested under 'message'
    if (data.success && data.message) {
      return {
        success: true,
        data: data.message,
        message: data.data || "Subcategory fetched successfully",
      };
    }

    return data;
  } catch (error) {
    console.error("Error fetching subcategory info:", error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

export const submitContactForm = async (formData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchsingleProduct = async (slug) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/product/product/${slug}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("Invalid response format from server");
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};

export const fetchCategoryProducts = async ({
  categoryName = "",
  subcategoryName = "",
}) => {
  try {
    let url;
    const timestamp = Date.now();

    if (subcategoryName && subcategoryName !== "all") {
      // Properly encode the subcategory name for URL
      const encodedSubcategory = encodeURIComponent(
        subcategoryName.toLowerCase().trim()
      );

      url = `${process.env.NEXT_PUBLIC_API_URL}/subcategory/products?subcategory=${encodedSubcategory}&_t=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      const rawData = await response.json();

      // If subcategory has no products, return empty array
      if (!rawData.success || !rawData.data?.products?.length) {
        return {
          success: false,
          data: { products: [] },
          message: "No products found in this subcategory",
        };
      }

      return normalizeProductData(rawData);
    }

    // If no subcategory or subcategory is 'all', fetch category products
    if (categoryName && categoryName !== "all") {
      // Properly encode the category name for URL
      const encodedCategory = encodeURIComponent(
        categoryName.toLowerCase().trim()
      );

      url = `${process.env.NEXT_PUBLIC_API_URL}/category/products?category=${encodedCategory}&_t=${timestamp}`;
    } else {
      url = `${process.env.NEXT_PUBLIC_API_URL}/product/all?_t=${timestamp}`;
    }

    console.log("Fetching category/all products:", { url, categoryName });

    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    const rawData = await response.json();

    console.log("Category/All API response:", {
      success: rawData.success,
      productCount: rawData.data?.products?.length || 0,
      totalProducts: rawData.data?.totalProducts || 0,
    });

    return normalizeProductData(rawData);
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      data: { products: [] },
      message: error.message,
    };
  }
};

// Helper function to normalize product data
const normalizeProductData = (rawData) => {
  if (!rawData || (!rawData.data?.products && !Array.isArray(rawData.data))) {
    console.warn("Unexpected data format received:", rawData);
    return {
      success: false,
      data: { products: [] },
      message: "Invalid data format received",
    };
  }

  const products = rawData.data?.products || rawData.data || [];

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    title: product.title || "Unnamed Product",
    description: product.description || "",
    shortDesc: product.shortDesc || product.description || "",
    price: product.price,
    saleprice: product.salePrice >= 0 ? product.salePrice : null,
    image: product.image || "",
    slug: product.slug || "",
    images: Array.isArray(product.images)
      ? product.images.map((img) =>
          typeof img === "string" ? img : img.url || ""
        )
      : [],
    categories: Array.isArray(product.categories)
      ? product.categories.map((c) => c.category?.name || "Uncategorized")
      : product.categories?.split(",").map((c) => c.trim()) || [],
    subCategories: Array.isArray(product.subCategories)
      ? product.subCategories.map((s) => s.subCategory?.name || "")
      : [],
  }));

  return {
    success: rawData.success || rawData.statusCode === 200,
    data: {
      products: normalizedProducts,
    },
    message: rawData.message || "Products fetched successfully",
  };
};
