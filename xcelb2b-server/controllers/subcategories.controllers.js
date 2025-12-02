import { prisma } from "../config/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

const getImageUrl = (filename) => {
  return `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${filename}`;
};

const normalizeForStorage = (text) => {
  return text.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
};

export const createSubCategory = asyncHandler(async (req, res) => {
  const { name, categoryId } = req.body;

  if (!name || !categoryId) {
    throw new ApiError(400, "Name and category ID are required");
  }
  const normalizedName = normalizeForStorage(name);
  const existingSubCategory = await prisma.subCategory.findUnique({
    where: {
      name: normalizedName,
    },
  });

  if (existingSubCategory) {
    throw new ApiError(400, "Sub-category with this name already exists");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(404, "Parent category not found");
  }

  try {
    const subCategoryData = {
      name: normalizedName,
      categoryId,
    };

    // Handle image upload if provided
    if (req.file) {
      subCategoryData.image = getImageUrl(req.file.filename);
    }

    const subCategory = await prisma.subCategory.create({
      data: subCategoryData,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, subCategory, "Sub-category created successfully")
      );
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file) {
      await deleteFromS3(getImageUrl(req.file.filename));
    }
    console.error("Error creating subcategory:", error);
    throw new ApiError(500, `Failed to create subcategory: ${error.message}`);
  }
});

export const getAllSubCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Optimize query with pagination and selective includes
  const [subCategories, totalSubCategories] = await Promise.all([
    prisma.subCategory.findMany({
      skip: offset,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        image: true,
        created_at: true,
        updated_at: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    }),
    prisma.subCategory.count(),
  ]);

  const totalPages = Math.ceil(totalSubCategories / parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, "Sub-categories fetched successfully", {
      subCategories,
      totalSubCategories,
      totalPages,
      currentPage: parseInt(page),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    })
  );
});

export const getSubcategoryInfoByName = asyncHandler(async (req, res) => {
  const { name } = req.params;

  if (!name) {
    throw new ApiError(400, "Subcategory name is required");
  }

  // Normalize the search name (handle URL encoding and formatting)
  const normalizedSearchName = decodeURIComponent(name)
    .toLowerCase()
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");

  // Try multiple matching strategies
  let subCategory = await prisma.subCategory.findFirst({
    where: {
      name: { equals: normalizedSearchName, mode: "insensitive" },
    },
    include: {
      category: true,
    },
  });

  // If exact match not found, try partial matching
  if (!subCategory) {
    subCategory = await prisma.subCategory.findFirst({
      where: {
        name: { contains: normalizedSearchName, mode: "insensitive" },
      },
      include: {
        category: true,
      },
    });
  }

  // If still not found, try normalized matching
  if (!subCategory) {
    const cleanSearchName = normalizedSearchName
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

    subCategory = await prisma.subCategory.findFirst({
      where: {
        name: {
          equals: cleanSearchName,
          mode: "insensitive",
        },
      },
      include: {
        category: true,
      },
    });
  }

  if (!subCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subCategory, "Sub-category fetched successfully")
    );
});

export const getSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      category: true,
      products: true,
    },
  });

  if (!subCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subCategory, "Sub-category fetched successfully")
    );
});

export const updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, categoryId } = req.body;

  if (!name && !categoryId && !req.file) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existingSubCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(404, "Parent category not found");
    }
  }

  try {
    const updateData = {
      name: name || undefined,
      categoryId: categoryId || undefined,
    };

    // Handle image update if provided
    if (req.file) {
      // Delete old image from S3 if exists
      if (existingSubCategory.image) {
        await deleteFromS3(existingSubCategory.image);
      }
      updateData.image = getImageUrl(req.file.filename);
    }

    const updatedSubCategory = await prisma.subCategory.update({
      where: { id },
      data: updateData,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedSubCategory,
          "Sub-category updated successfully"
        )
      );
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file) {
      await deleteFromS3(getImageUrl(req.file.filename));
    }
    console.error("Error updating subcategory:", error);
    throw new ApiError(500, `Failed to update subcategory: ${error.message}`);
  }
});

export const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      products: true,
    },
  });

  if (!existingSubCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  try {
    // Delete image from S3 if exists
    if (existingSubCategory.image) {
      await deleteFromS3(existingSubCategory.image);
    }

    await prisma.$transaction([
      // First delete all product-subcategory relationships
      prisma.productSubCategory.deleteMany({
        where: {
          subCategoryId: id,
        },
      }),
      // Then delete the subcategory
      prisma.subCategory.delete({
        where: { id },
      }),
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Sub-category deleted successfully"));
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    throw new ApiError(500, `Failed to delete sub-category: ${error.message}`);
  }
});

// Add robust normalization for subcategory matching
function robustNormalize(text) {
  if (!text) return "";
  return decodeURIComponent(text).toLowerCase().replace(/\s+/g, " ").trim();
}

export const getSubCategoryProducts = asyncHandler(async (req, res) => {
  const { subcategory, page, limit } = req.query;

  try {
    // If no pagination parameters are provided, return all products
    const shouldPaginate = page && limit;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 1000; // Large limit to get all products
    const offset = shouldPaginate ? (pageNum - 1) * limitNum : 0;
    const take = shouldPaginate ? limitNum : undefined;

    console.log("Subcategory products request:", {
      subcategory,
      page,
      limit,
      shouldPaginate,
      take,
    });

    let products = [];
    let totalProducts = 0;

    if (!subcategory || subcategory === "all") {
      // Optimize query for all products
      const [productsData, total] = await Promise.all([
        prisma.products.findMany({
          skip: offset,
          take: take,
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
      console.log("All products fetched:", {
        count: products.length,
        total: totalProducts,
      });
    } else {
      // Robust normalization and matching for subcategory
      const incoming = robustNormalize(subcategory);

      console.log("Normalized subcategory:", incoming);

      // Try multiple matching strategies
      let subCategoryData = null;

      // Strategy 1: Exact match with normalized name
      subCategoryData = await prisma.subCategory.findFirst({
        where: {
          name: { equals: incoming, mode: "insensitive" },
        },
        select: { id: true },
      });

      // Strategy 2: If no exact match, try with contains
      if (!subCategoryData) {
        subCategoryData = await prisma.subCategory.findFirst({
          where: {
            name: { contains: incoming, mode: "insensitive" },
          },
          select: { id: true },
        });
      }

      // Strategy 3: Try with dash variants (add/remove dashes)
      if (!subCategoryData) {
        const dashVariants = [
          incoming.replace(/\s+/g, " - "),
          incoming.replace(/\s*-\s*/g, " "),
          incoming.replace(/\s+/g, "-"),
        ];

        for (const variant of dashVariants) {
          subCategoryData = await prisma.subCategory.findFirst({
            where: {
              name: { equals: variant, mode: "insensitive" },
            },
            select: { id: true },
          });
          if (subCategoryData) break;
        }
      }

      // Strategy 4: Try with ampersand/and variants
      if (!subCategoryData) {
        const ampVariant = incoming.replace(/and/g, "&");
        const andVariant = incoming.replace(/&/g, "and");

        subCategoryData = await prisma.subCategory.findFirst({
          where: {
            OR: [
              { name: { equals: ampVariant, mode: "insensitive" } },
              { name: { equals: andVariant, mode: "insensitive" } },
              { name: { contains: ampVariant, mode: "insensitive" } },
              { name: { contains: andVariant, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
      }

      if (!subCategoryData) {
        console.log("Subcategory not found:", incoming);
        return res.status(200).json({
          success: false,
          data: {
            products: [],
            totalProducts: 0,
            totalPages: 0,
            currentPage: pageNum,
          },
          message: "Subcategory not found",
        });
      }

      console.log("Found subcategory:", subCategoryData);

      // Optimize query for subcategory-specific products
      const [productsData, total] = await Promise.all([
        prisma.products.findMany({
          where: {
            subCategories: {
              some: {
                subCategoryId: subCategoryData.id,
              },
            },
          },
          skip: offset,
          take: take,
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
            subCategories: {
              some: {
                subCategoryId: subCategoryData.id,
              },
            },
          },
        }),
      ]);

      products = productsData;
      totalProducts = total;
      console.log("Subcategory products fetched:", {
        count: products.length,
        total: totalProducts,
        subcategory: incoming,
      });
    }

    const totalPages = shouldPaginate ? Math.ceil(totalProducts / limitNum) : 1;

    return res.status(200).json({
      success: true,
      data: {
        products,
        totalProducts,
        totalPages,
        currentPage: pageNum,
        hasNextPage: shouldPaginate ? pageNum < totalPages : false,
        hasPrevPage: shouldPaginate ? pageNum > 1 : false,
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

// Get subcategories by category name
export const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      throw new ApiError(400, "Category parameter is required");
    }

    // Normalize the category name
    const normalizedCategory = category.toLowerCase().trim();

    // Find the category first
    const categoryData = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: normalizedCategory, mode: "insensitive" } },
          { name: { contains: normalizedCategory, mode: "insensitive" } },
        ],
      },
    });

    if (!categoryData) {
      return res.status(200).json({
        success: false,
        data: { subcategories: [] },
        message: "Category not found",
      });
    }

    // Get all subcategories for this category
    const subcategories = await prisma.subCategory.findMany({
      where: {
        categoryId: categoryData.id,
      },
      include: {
        category: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Add placeholder image for subcategories without images
    const subcategoriesWithPlaceholder = subcategories.map((subcategory) => ({
      ...subcategory,
      image: subcategory.image || "/place.jpeg", // Placeholder image path
    }));

    return res.status(200).json({
      success: true,
      data: {
        category: categoryData,
        subcategories: subcategoriesWithPlaceholder,
      },
      message: "Subcategories fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching subcategories by category:", error);
    return res.status(500).json({
      success: false,
      data: { subcategories: [] },
      message: error.message || "Failed to fetch subcategories",
    });
  }
});
