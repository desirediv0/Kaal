import { prisma } from "../config/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getUserLimit = asyncHandler(async (req, res) => {
  const userLimit = await prisma.userLimit.findFirst();

  if (!userLimit) {
    throw new ApiError(404, "User limit not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "User limit fetched successfully", userLimit));
});

export const updateUserLimit = asyncHandler(async (req, res) => {
  const { maxRole } = req.body;

  const userLimit = await prisma.userLimit.update({
    where: { id: req.params.id },
    data: { maxRole },
  });

  if (!userLimit) {
    throw new ApiError(404, "User limit not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "User limit updated successfully", userLimit));
});
