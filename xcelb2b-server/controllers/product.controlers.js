import { prisma } from "../config/db.config.js";
import { createSlug } from "../helper/slug.js";
import { validateText } from "../helper/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

const generateUniqueSlug = async (slug, name) => {
  let uniqueSlug = slug ? createSlug(slug) : createSlug(name);

  let existingSlug = await prisma.products.findUnique({
    where: { slug: uniqueSlug },
  });

  let counter = 1;

  while (existingSlug) {
    uniqueSlug = `${createSlug(slug || name)}-${counter}`;

    existingSlug = await prisma.products.findUnique({
      where: { slug: uniqueSlug },
    });

    counter++;
  }

  return uniqueSlug;
};

const createMetaDescription = (description) => {
  if (!description) return "";

  const cleanText = description
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText.length > 160
    ? cleanText.substring(0, 160) + "..."
    : cleanText;
};

const getImageUrl = (filename) => {
  return `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${filename}`;
};
export const createProducts = asyncHandler(async (req, res) => {
  let {
    title,
    description,
    shortDesc,
    price,
    salePrice,
    categoryIds,
    seoTitle,
    seoDesc,
    subCategoryIds,
  } = req.body;

  // Basic validation
  validateText(title);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Parse and validate categories
  if (typeof categoryIds === "string") {
    categoryIds = [categoryIds];
  }

  // Convert to array if needed
  if (!Array.isArray(categoryIds)) {
    categoryIds = Object.values(categoryIds || {});
  }

  // Filter valid UUID format
  categoryIds = categoryIds.filter(
    (id) =>
      typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
  );

  // Get uncategorized if no valid categories
  if (!categoryIds.length) {
    const uncategorized = await prisma.category.findFirst({
      where: { name: "Uncategorized" },
    });

    if (!uncategorized) {
      throw new ApiError(500, "Uncategorized category not found");
    }
    categoryIds = [uncategorized.id];
  }

  // Validate categories exist
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  if (!categories.length) {
    throw new ApiError(404, "No valid categories found");
  }

  // Handle subcategories (optional)
  let validSubCategoryIds = [];
  if (subCategoryIds && subCategoryIds.length > 0) {
    // Convert to array if needed
    if (!Array.isArray(subCategoryIds)) {
      subCategoryIds = Object.values(subCategoryIds || {});
    }

    // Filter valid UUIDs
    subCategoryIds = subCategoryIds.filter(
      (id) =>
        typeof id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id
        )
    );

    if (subCategoryIds.length > 0) {
      const validSubCategories = await prisma.subCategory.findMany({
        where: {
          AND: [
            { id: { in: subCategoryIds } },
            { categoryId: { in: categoryIds } },
          ],
        },
      });
      validSubCategoryIds = validSubCategories.map((sc) => sc.id);
    }
  }

  // Validate thumbnail
  const thumbnail = req.files?.image?.[0];
  if (!thumbnail) {
    throw new ApiError(400, "Please provide a valid image file");
  }

  // Generate meta fields
  const finalMetaTitle = seoTitle || title;
  const finalMetaDesc = seoDesc || createMetaDescription(description);

  try {
    const slug = await generateUniqueSlug(null, title);

    const productData = {
      title: title.trim(),
      description: description.trim(),
      shortDesc: shortDesc.trim(),
      price: price ? parseFloat(price) : 0,
      salePrice: salePrice ? parseFloat(salePrice) : 0,
      image: getImageUrl(thumbnail.filename),
      seoTitle: finalMetaTitle.trim(),
      seoDesc: finalMetaDesc.trim(),
      slug,
      categories: {
        create: categoryIds.map((categoryId) => ({
          categoryId,
        })),
      },
      // Only add subcategories if valid ones exist
      ...(validSubCategoryIds.length > 0 && {
        subCategories: {
          create: validSubCategoryIds.map((subCategoryId) => ({
            subCategoryId,
          })),
        },
      }),
    };

    const product = await prisma.products.create({
      data: productData,
      include: {
        categories: {
          include: { category: true },
        },
        subCategories: {
          include: { subCategory: true },
        },
        images: true,
      },
    });

    // Handle additional images
    if (req.files.images?.length > 0) {
      await prisma.productImage.createMany({
        data: req.files.images.map((file) => ({
          url: getImageUrl(file.filename),
          productId: product.id,
        })),
      });
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  } catch (error) {
    // Cleanup uploaded files
    await handleImageCleanup([
      thumbnail?.filename,
      ...(req.files?.images?.map((img) => img.filename) || []),
    ]);

    console.error("Error creating product:", error);
    throw new ApiError(500, `Failed to create product: ${error.message}`);
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { title, description, price, salePrice, shortDesc, seoTitle, seoDesc } =
    req.body;

  const slug = req.params.slug;

  // Get product with relations
  const product = await prisma.products.findUnique({
    where: { slug },
    include: {
      categories: true,
      images: true,
      subCategories: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Parse category IDs with better handling
  let categoryIds = [];
  if (req.body.categoryIds || req.body["categoryIds[]"]) {
    categoryIds = Array.isArray(
      req.body.categoryIds || req.body["categoryIds[]"]
    )
      ? req.body.categoryIds || req.body["categoryIds[]"]
      : [req.body.categoryIds || req.body["categoryIds[]"]];

    categoryIds = categoryIds.map((id) => id.toString()).filter(Boolean);
  }

  // Parse subcategory IDs with better handling
  let subCategoryIds = [];
  if (req.body.subCategoryIds || req.body["subCategoryIds[]"]) {
    subCategoryIds = Array.isArray(
      req.body.subCategoryIds || req.body["subCategoryIds[]"]
    )
      ? req.body.subCategoryIds || req.body["subCategoryIds[]"]
      : [req.body.subCategoryIds || req.body["subCategoryIds[]"]];

    subCategoryIds = subCategoryIds.map((id) => id.toString()).filter(Boolean);
  }

  // Get uncategorized if no categories selected
  if (categoryIds.length === 0) {
    const uncategorizedCategory = await prisma.category.findFirst({
      where: { name: "Uncategorized" },
      select: { id: true },
    });

    if (!uncategorizedCategory) {
      throw new ApiError(500, "Default category not found");
    }

    categoryIds = [uncategorizedCategory.id];
  }

  // Validate subcategories belong to selected categories
  if (subCategoryIds.length > 0) {
    const validSubCategories = await prisma.subCategory.findMany({
      where: {
        AND: [
          { id: { in: subCategoryIds } },
          { categoryId: { in: categoryIds } },
        ],
      },
    });

    // Only keep valid subcategories
    subCategoryIds = validSubCategories.map((sub) => sub.id);
  }

  const updateFields = {};

  // Basic field validation
  if (title && title !== product.title) {
    validateText(title);
    updateFields.title = title.trim();
    updateFields.slug = await generateUniqueSlug(null, title);
  }

  if (description && description !== product.description) {
    validateText(description);
    updateFields.description = description.trim();
  }

  if (shortDesc && shortDesc !== product.shortDesc) {
    validateText(shortDesc);
    updateFields.shortDesc = shortDesc.trim();
  }

  // SEO fields
  if (seoTitle && seoTitle !== product.seoTitle) {
    updateFields.seoTitle = seoTitle.trim();
  }

  if (seoDesc && seoDesc !== product.seoDesc) {
    updateFields.seoDesc = seoDesc.trim();
  }

  // Price validation
  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      throw new ApiError(400, "Invalid price format");
    }
    updateFields.price = parsedPrice;
  }

  if (salePrice !== undefined) {
    const parsedSalePrice = parseFloat(salePrice);
    if (isNaN(parsedSalePrice)) {
      throw new ApiError(400, "Invalid sale price format");
    }
    updateFields.salePrice = parsedSalePrice;
  }

  try {
    const updatedProduct = await prisma.$transaction(async (prisma) => {
      // Always update relations
      await prisma.productCategory.deleteMany({
        where: { productId: product.id },
      });

      await prisma.productCategory.createMany({
        data: categoryIds.map((id) => ({
          productId: product.id,
          categoryId: id,
        })),
      });

      await prisma.productSubCategory.deleteMany({
        where: { productId: product.id },
      });

      if (subCategoryIds.length > 0) {
        await prisma.productSubCategory.createMany({
          data: subCategoryIds.map((id) => ({
            productId: product.id,
            subCategoryId: id,
          })),
        });
      }

      // Update product data
      let updatedProduct = await prisma.products.update({
        where: { slug },
        data: updateFields,
        include: {
          categories: {
            include: { category: true },
          },
          subCategories: {
            include: { subCategory: true },
          },
          images: true,
        },
      });

      // Handle main image
      if (req.files?.image?.[0]) {
        if (updatedProduct.image) {
          await deleteFromS3(updatedProduct.image);
        }

        updatedProduct = await prisma.products.update({
          where: { id: updatedProduct.id },
          data: {
            image: getImageUrl(req.files.image[0].filename),
          },
          include: {
            categories: { include: { category: true } },
            subCategories: { include: { subCategory: true } },
            images: true,
          },
        });
      }

      // Handle additional images
      if (req.files?.images?.length) {
        // Delete existing images
        await Promise.all(
          updatedProduct.images.map((img) => deleteFromS3(img.url))
        );

        await prisma.productImage.deleteMany({
          where: { productId: updatedProduct.id },
        });

        // Create new images
        await prisma.productImage.createMany({
          data: req.files.images.map((file) => ({
            url: getImageUrl(file.filename),
            productId: updatedProduct.id,
          })),
        });

        // Get fresh data
        updatedProduct = await prisma.products.findUnique({
          where: { id: updatedProduct.id },
          include: {
            categories: { include: { category: true } },
            subCategories: { include: { subCategory: true } },
            images: true,
          },
        });
      }

      return updatedProduct;
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Product updated successfully", updatedProduct)
      );
  } catch (error) {
    // Cleanup uploaded files on error
    if (req.files?.image?.[0]) {
      await deleteFromS3(getImageUrl(req.files.image[0].filename));
    }
    if (req.files?.images?.length) {
      await Promise.all(
        req.files.images.map((file) => deleteFromS3(getImageUrl(file.filename)))
      );
    }

    console.error("Error updating product:", error);
    throw new ApiError(500, `Failed to update product: ${error.message}`);
  }
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const products = await prisma.products.findMany({
    skip: offset,
    take: limit,
    orderBy: { created_at: "asc" },
    include: {
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
      images: true,
    },
  });

  const totalProducts = await prisma.products.count();
  const totalPages = Math.ceil(totalProducts / limit);

  const formattedProducts = products.map((product) => ({
    ...product,
    categories: product.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
    })),
  }));

  return res.status(200).json(
    new ApiResponse(200, "Products retrieved successfully", {
      products: formattedProducts,
      totalProducts,
      totalPages,
      currentPage: page,
    })
  );
});

export const getOneProduct = asyncHandler(async (req, res) => {
  const slug = req.params.slug;

  const product = await prisma.products.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      images: true,
      subCategories: {
        include: {
          subCategory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Product retrieved successfully", product));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const slug = req.params.slug;

  const product = await prisma.products.findUnique({
    where: { slug },
    include: {
      images: true,
      categories: true,
      subCategories: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const imageKeys = [];

    // Add main image
    if (product.image) {
      imageKeys.push(product.image);
    }

    // Add additional images
    if (product.images?.length > 0) {
      imageKeys.push(...product.images.map((img) => img.url));
    }

    await handleImageCleanup(imageKeys);

    // Delete database records in transaction
    await prisma.$transaction([
      prisma.productImage.deleteMany({
        where: { productId: product.id },
      }),
      prisma.productSubCategory.deleteMany({
        where: { productId: product.id },
      }),
      prisma.productCategory.deleteMany({
        where: { productId: product.id },
      }),
      prisma.products.delete({
        where: { id: product.id },
      }),
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Product and associated data deleted successfully")
      );
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new ApiError(500, `Failed to delete product: ${error.message}`);
  }
});
export const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new ApiError(400, "Please provide a search query");
  }

  try {
    const products = await prisma.products.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        images: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Products retrieved successfully", products));
  } catch (error) {
    console.error("Error searching products:", error);
    throw new ApiError(500, "An error occurred while searching for products");
  }
});

export const getAllProductsLength = asyncHandler(async (req, res) => {
  const totalProducts = await prisma.products.count();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total products retrieved successfully",
        totalProducts
      )
    );
});

export const getAllProductsLengthAndDate = asyncHandler(async (req, res) => {
  const totalProducts = await prisma.products.count();
  const products = await prisma.products.findMany({
    select: {
      created_at: true,
    },
  });

  const creationDates = products.map((product) =>
    product.created_at.toDateString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total products and creation dates retrieved successfully",
        { totalProducts, creationDates }
      )
    );
});

export const allProducts = asyncHandler(async (req, res) => {
  try {
    // Add pagination support for better performance
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to 1000, can be increased if needed
    const offset = (page - 1) * limit;

    // Use select instead of include for better performance - only fetch needed fields
    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        skip: offset,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          shortDesc: true,
          price: true,
          salePrice: true,
          image: true,
          slug: true,
          created_at: true,
          updated_at: true,
          categories: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          subCategories: {
            select: {
              subCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
          images: {
            select: {
              url: true,
            },
          },
        },
      }),
      prisma.products.count(),
    ]);

    if (!products || products.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No products found", []));
    }

    const formattedProducts = products
      .map((product) => {
        try {
          return {
            id: product.id,
            title: product.title,
            description: product.description || "N/A",
            shortDesc: product.shortDesc || "N/A",
            price: product.price || "N/A",
            salePrice: product.salePrice || "N/A",
            image: product.image || "N/A",
            slug: product.slug,
            categories:
              product.categories
                ?.map((cat) => cat.category?.name)
                .filter(Boolean)
                .join(", ") || "N/A",
            subCategories:
              product.subCategories
                ?.map((sub) => sub.subCategory?.name)
                .filter(Boolean)
                .join(", ") || "N/A",
            created_at: product.created_at,
            updated_at: product.updated_at,
            images: product.images.map((img) => img.url),
          };
        } catch (err) {
          console.error("Error formatting product:", err);
          return null;
        }
      })
      .filter(Boolean);

    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json(
      new ApiResponse(200, "Products retrieved successfully", {
        products: formattedProducts,
        totalProducts,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      })
    );
  } catch (error) {
    console.error("Error details:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, `Error fetching products: ${error.message}`, null)
      );
  }
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const { imageId } = req.body;

  if (!imageId) {
    throw new ApiError(400, "Please provide a valid image ID to delete");
  }

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new ApiError(404, "No image found with the provided ID");
    }

    // Delete from Spaces
    await deleteFromS3(image.url);

    // Delete database record
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Image deleted successfully"));
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new ApiError(500, `Failed to delete image: ${error.message}`);
  }
});

export const GetProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Optimize: Use select instead of include for better performance
  const product = await prisma.products.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      shortDesc: true,
      price: true,
      salePrice: true,
      image: true,
      slug: true,
      seoTitle: true,
      seoDesc: true,
      created_at: true,
      updated_at: true,
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
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Product retrieved successfully", product));
});

export const userSearchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new ApiError(400, "Please provide a search query");
  }

  try {
    // Handle empty query - return recent products instead of error
    const cleanQuery =
      q
        ?.toLowerCase()
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim() || "";

    // Optimize: Require minimum 2 characters for search to avoid slow queries
    if (cleanQuery.length < 2) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            [],
            "Please provide at least 2 characters for search"
          )
        );
    }

    // Optimize: Use select with only needed fields, limit to 10 results
    // The title index will be used automatically by Prisma for contains queries
    const products = await prisma.products.findMany({
      where: {
        title: {
          contains: cleanQuery,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        shortDesc: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 10, // Limit results for better performance
    });

    // Format the response data
    const formattedProducts = products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      image: product.image,
      shortDesc: product.shortDesc,
      category: product.categories[0]?.category.name || "Uncategorized",
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedProducts,
          formattedProducts.length > 0
            ? `Found ${formattedProducts.length} products`
            : "No products found"
        )
      );
  } catch (error) {
    console.error("Search error:", error);
    throw new ApiError(500, "Search failed");
  }
});
