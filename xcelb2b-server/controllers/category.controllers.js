import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.config.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import s3client from "../utils/s3client.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

const deleteFromS3 = async (fileUrl) => {
  try {
    let Key;

    // Check if fileUrl is a full URL
    if (fileUrl.startsWith("http")) {
      const parsedUrl = new URL(fileUrl);
      Key = parsedUrl.pathname.slice(1);
    } else {
      Key = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    }

    await s3client.send(
      new DeleteObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key,
      })
    );
  } catch (error) {
    console.error("S3 deletion error:", error);
    throw error;
  }
};

const handleImageCleanup = async (fileUrls) => {
  if (!fileUrls?.length) return;

  await Promise.all(fileUrls.map((url) => deleteFromS3(url)));
};

// Create a new category
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const category = await prisma.category.create({
    data: {
      name: name.toLowerCase().trim(),
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Category created successfully", category));
});

// Get all categories
export const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Optimize query with pagination and selective includes
    const [categories, totalCategories] = await Promise.all([
      prisma.category.findMany({
        skip: offset,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          created_at: true,
          updated_at: true,
          subCategories: {
            select: {
              id: true,
              name: true,
              image: true,
              created_at: true,
            },
            orderBy: {
              created_at: "asc",
            },
          },
          _count: {
            select: {
              products: true,
              subCategories: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      }),
      prisma.category.count(),
    ]);

    const totalPages = Math.ceil(totalCategories / parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, "Categories retrieved successfully", {
        categories,
        totalCategories,
        totalPages,
        currentPage: parseInt(page),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      })
    );
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    throw new ApiError(500, "Failed to retrieve categories");
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;

  // Find category with subcategories
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subCategories: true,
      products: true,
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (category.name === "Uncategorized") {
    throw new ApiError(400, "Cannot delete uncategorized category");
  }

  // Find Uncategorized category
  const uncategorizedCategory = await prisma.category.findFirst({
    where: { name: "Uncategorized" },
  });

  if (!uncategorizedCategory) {
    throw new ApiError(500, "Uncategorized category not found");
  }

  // Begin transaction to ensure all operations complete or none do
  await prisma.$transaction(async (prisma) => {
    // 1. Get all subcategory IDs and collect images for S3 deletion
    const subcategoryIds = category.subCategories.map((sub) => sub.id);
    const subcategoryImages = category.subCategories
      .filter((sub) => sub.image)
      .map((sub) => sub.image);

    // 2. Delete subcategory images from S3
    if (subcategoryImages.length > 0) {
      try {
        await handleImageCleanup(subcategoryImages);
      } catch (error) {
        console.error("Error deleting subcategory images from S3:", error);
        // Continue with deletion even if S3 cleanup fails
      }
    }

    // 3. Move products from subcategories to Uncategorized
    if (subcategoryIds.length > 0) {
      // Delete product-subcategory relationships
      await prisma.productSubCategory.deleteMany({
        where: {
          subCategoryId: {
            in: subcategoryIds,
          },
        },
      });
    }

    // 4. Handle products in the main category
    await prisma.productCategory
      .findMany({
        where: {
          categoryId: id,
        },
        include: {
          product: {
            include: {
              categories: true,
            },
          },
        },
      })
      .then(async (productCategories) => {
        for (const pc of productCategories) {
          // If product has only this category, move to Uncategorized
          if (pc.product.categories.length === 1) {
            await prisma.productCategory.create({
              data: {
                productId: pc.productId,
                categoryId: uncategorizedCategory.id,
              },
            });
          }
        }

        // Delete all product-category relationships
        await prisma.productCategory.deleteMany({
          where: {
            categoryId: id,
          },
        });
      });

    // 5. Delete all subcategories
    if (subcategoryIds.length > 0) {
      await prisma.subCategory.deleteMany({
        where: {
          id: {
            in: subcategoryIds,
          },
        },
      });
    }

    // 6. Finally delete the main category
    await prisma.category.delete({
      where: { id },
    });
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Category and all subcategories deleted successfully"
      )
    );
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const id = req.params.id;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const data = await prisma.category.update({
    where: { id },
    data: {
      name: name.toLowerCase().trim(),
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Category updated successfully", data));
});

export const getCategoriesLength = asyncHandler(async (req, res) => {
  const categories = await prisma.category.count();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Categories length retrieved successfully",
        categories
      )
    );
});

export const getCategoriesLengthAndDate = asyncHandler(async (req, res) => {
  const totalCategories = await prisma.category.count();
  const categories = await prisma.category.findMany({
    select: {
      created_at: true,
    },
  });

  const creationDates = categories.map((category) =>
    category.created_at.toDateString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total categories and creation dates retrieved successfully",
        { totalCategories, creationDates }
      )
    );
});
const normalizeText = (text) => {
  return text.toLowerCase().replace(/-/g, " ").trim();
};
export const getProducts = asyncHandler(async (req, res) => {
  const { category, page, limit } = req.query;

  try {
    // Always use pagination for better performance - default to 1000 if not specified
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 1000;
    const offset = (pageNum - 1) * limitNum;

    let products = [];
    let totalProducts = 0;

    if (!category || category === "all") {
      // Optimize query for all products - use Promise.all for parallel execution
      const [productsData, total] = await Promise.all([
        prisma.products.findMany({
          skip: offset,
          take: limitNum,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            title: true,
            shortDesc: true,
            price: true,
            salePrice: true,
            image: true,
            slug: true,
            created_at: true,
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            subCategories: {
              select: {
                subCategory: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            images: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        }),
        prisma.products.count(),
      ]);

      products = productsData;
      totalProducts = total;
    } else {
      const formattedName = normalizeText(category);

      // Optimize category lookup - try exact match first, then contains
      const categoryData = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: formattedName, mode: "insensitive" } },
            { name: { contains: formattedName, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });

      if (!categoryData) {
        return res.status(200).json({
          success: false,
          data: {
            products: [],
            totalProducts: 0,
            totalPages: 0,
            currentPage: pageNum,
          },
          message: "Category not found",
        });
      }

      // Optimize query for category-specific products - use Promise.all
      const [productsData, total] = await Promise.all([
        prisma.products.findMany({
          where: {
            categories: {
              some: {
                categoryId: categoryData.id,
              },
            },
          },
          skip: offset,
          take: limitNum,
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            title: true,
            shortDesc: true,
            price: true,
            salePrice: true,
            image: true,
            slug: true,
            created_at: true,
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            subCategories: {
              select: {
                subCategory: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            images: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        }),
        prisma.products.count({
          where: {
            categories: {
              some: {
                categoryId: categoryData.id,
              },
            },
          },
        }),
      ]);

      products = productsData;
      totalProducts = total;
    }

    const totalPages = Math.ceil(totalProducts / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        products,
        totalProducts,
        totalPages,
        currentPage: pageNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      message: "Products fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      data: { products: [] },
      message: error.message || "Failed to fetch products",
    });
  }
});

export const getCategoryWithSubCategories = asyncHandler(async (req, res) => {
  const { category } = req.query;

  try {
    let categoryData;

    if (!category || category === "all") {
      // Get all categories with their subcategories
      categoryData = await prisma.category.findMany({
        orderBy: { created_at: "asc" },
        include: {
          subCategories: {
            orderBy: { created_at: "asc" },
          },
        },
      });
    } else {
      // Search with flexible matching
      const searchTerm = category
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/&/g, "and")
        .trim();

      categoryData = await prisma.category.findFirst({
        where: {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        include: {
          subCategories: {
            orderBy: { created_at: "asc" },
          },
        },
      });

      if (!categoryData) {
        return ApiError(404, "Category not found");
      }
    }

    return res.status(200).json({
      success: true,
      data: categoryData,
      message: "Category data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || "Failed to fetch category data",
    });
  }
});

export const getCategorySubcategories = asyncHandler(async (req, res) => {
  const { category } = req.params;

  try {
    // Find category and include its subcategories
    const categoryData = await prisma.category.findUnique({
      where: {
        name: category.toLowerCase().trim(),
      },
      orderBy: { created_at: "asc" },
      include: {
        subCategories: {
          select: {
            id: true,
            name: true,
            categoryId: true,
          },
        },
      },
    });

    if (!categoryData) {
      throw new ApiError(404, "Category not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Subcategories fetched successfully",
          categoryData.subCategories
        )
      );
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to fetch subcategories"
    );
  }
});
