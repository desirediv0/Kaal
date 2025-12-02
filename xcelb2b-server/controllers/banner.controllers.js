import { prisma } from "../config/db.config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public/upload");

export const createBanner = asyncHandler(async (req, res) => {
  const { title, linkUrl, description, isActive } = req.body;

  if (!req.file) {
    throw new ApiError(400, "Image is required");
  }

  const imageUrl = `/upload/${req.file.filename}`;

  const lastBanner = await prisma.banner.findFirst({
    orderBy: {
      position: "desc",
    },
  });

  const position = lastBanner ? lastBanner.position + 1 : 0;

  try {
    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl,
        description,
        position,
        isActive: isActive === "true",
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, "Banner created successfully", banner));
  } catch (error) {
    // If there's an error, delete the uploaded file
    await fs
      .unlink(path.join(UPLOAD_DIR, req.file.filename))
      .catch(console.error);
    throw error;
  }
});

export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, linkUrl, description, isActive } = req.body;

  const existingBanner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!existingBanner) {
    throw new ApiError(404, "Banner not found");
  }

  const updateData = {
    title,
    linkUrl,
    description,
    isActive: isActive === "true",
  };

  if (req.file) {
    updateData.imageUrl = `/upload/${req.file.filename}`;
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: updateData,
  });

  // If a new image was uploaded, delete the old one
  if (req.file && existingBanner.imageUrl) {
    const oldImagePath = path.join(
      UPLOAD_DIR,
      existingBanner.imageUrl.replace("/upload/", "")
    );
    await fs.unlink(oldImagePath).catch(console.error);
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Banner updated successfully", banner));
});

export const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    orderBy: {
      position: "asc",
    },
  });

  if (banners.length === 0) {
    return res.status(200).json(new ApiResponse(200, "No banners found", []));
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Banners fetched successfully", banners));
});

export const getBannerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Banner fetched successfully", banner));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  const deletedBannerPosition = banner.position;

  await prisma.banner.delete({
    where: { id },
  });

  // Delete the associated image file
  if (banner.imageUrl) {
    const imagePath = path.join(
      UPLOAD_DIR,
      banner.imageUrl.replace("/upload/", "")
    );
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.error(`Failed to delete image file: ${imagePath}`, error);
    }
  }

  // Update the positions of the remaining banners
  const bannersToUpdate = await prisma.banner.findMany({
    where: {
      position: {
        gt: deletedBannerPosition,
      },
    },
    orderBy: {
      position: "asc",
    },
  });

  await prisma.$transaction(
    bannersToUpdate.map((b) =>
      prisma.banner.update({
        where: { id: b.id },
        data: { position: b.position - 1 },
      })
    )
  );

  res.status(200).json(new ApiResponse(200, "Banner deleted successfully"));
});

export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  if (banners.length === 0) {
    return res.status(200).json(new ApiResponse(200, "No banners found", []));
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Banners fetched successfully", banners));
});

export const updateBannerPosition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPosition } = req.body;

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  const banners = await prisma.banner.findMany({
    orderBy: {
      position: "asc",
    },
  });

  const oldPosition = banner.position;
  const updatedBanners = banners.map((b) => {
    if (b.id === id) {
      return { ...b, position: newPosition };
    } else if (
      oldPosition < newPosition &&
      b.position > oldPosition &&
      b.position <= newPosition
    ) {
      return { ...b, position: b.position - 1 };
    } else if (
      oldPosition > newPosition &&
      b.position >= newPosition &&
      b.position < oldPosition
    ) {
      return { ...b, position: b.position + 1 };
    }
    return b;
  });

  await prisma.$transaction(
    updatedBanners.map((b) =>
      prisma.banner.update({
        where: { id: b.id },
        data: { position: b.position },
      })
    )
  );

  res
    .status(200)
    .json(new ApiResponse(200, "Banner position updated successfully"));
});

export const assignPositionsToBanners = asyncHandler(async (req, res) => {
  // Fetch banners with position 0
  const banners = await prisma.banner.findMany({
    where: { position: 0 },
    orderBy: { createdAt: "asc" },
  });

  // Assign positions based on creation date
  const updatedBanners = banners.map((banner, index) => ({
    ...banner,
    position: index + 1,
  }));

  // Update the positions in the database
  await prisma.$transaction(
    updatedBanners.map((banner) =>
      prisma.banner.update({
        where: { id: banner.id },
        data: { position: banner.position },
      })
    )
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, "Positions assigned successfully", updatedBanners)
    );
});
