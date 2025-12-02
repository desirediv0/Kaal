import { prisma } from "../config/db.config.js";
import { validateEmail, validatePassword } from "../helper/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessAndRefreshTokens } from "../helper/generate-access-&-refresh-tokens.js";

const SALT_ROUNDS = 12;
const COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const findUserByEmail = async (email) => {
  email = email.toLowerCase().trim();

  validateEmail(email);

  return await prisma.user.findUnique({
    where: { email },
  });
};

const setCookies = (res, accessToken, refreshToken) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: new Date(Date.now() + COOKIE_EXPIRY),
  };

  res.cookie("refreshToken", refreshToken, options);
  res.cookie("accessToken", accessToken, options);
};

const updateUser = async (id, data) => {
  return await prisma.user.update({ where: { id }, data });
};

const getUserLimit = async () => {
  const userLimit = await prisma.userLimit.findFirst();
  if (!userLimit) {
    throw new ApiError(404, "User limit not found");
  }
  return userLimit.maxRole;
};

// controllers

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  validatePassword(password);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  if (!user) {
    throw new ApiError(400, "Failed to register user");
  }

  const userLimitExists = await prisma.userLimit.findFirst();
  if (!userLimitExists) {
    await prisma.userLimit.create({
      data: {
        maxRole: 6,
      },
    });
  }

  const isActive = await prisma.active.findFirst({ where: { status: true } });

  if (!isActive) {
    await prisma.active.create({
      data: {
        status: true,
      },
    });
  }
  const existingCategory = await prisma.category.findFirst({
    where: { name: "Uncategorized" },
  });

  // If not, create it
  if (!existingCategory) {
    await prisma.category.create({
      data: {
        name: "Uncategorized",
      },
    });
    console.log("Default category created: Uncategorized");
  }

  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", user));
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    validatePassword(password);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id,
      { name: user.name, email: user.email, role: user.role }
    );

    setCookies(res, accessToken, refreshToken);

    res.status(200).json(new ApiResponse(200, "Login successful", accessToken));
  } catch (error) {
    throw new ApiError(401, "Invalid email or password", error);
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await updateUser(userId, { refreshToken: null });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await prisma.user.delete({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(404, "User not found or already deleted");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    if (error.code === "P2025") {
      throw new ApiError(404, "User not found");
    }
    throw new ApiError(400, "Failed to delete user", error);
  }
});

export const GetLoggedInUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User details fetched successfully", user));
});

export const checkAuth = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, "Authenticated user!"));
  } catch (error) {
    throw new ApiError(400, "Failed to authenticate user", error);
  }
});

export const createRole = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "All fields are required");
  }

  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Only admins can create roles");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const roleCount = await prisma.user.count();
  const maxRoles = await getUserLimit();

  if (roleCount >= maxRoles) {
    throw new ApiError(400, `Cannot create more than ${maxRoles - 1} users.`);
  }

  validatePassword(password);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  if (!user) {
    throw new ApiError(400, "Failed to create role");
  }

  res.status(201).json(new ApiResponse(201, "Role created successfully", user));
});

export const getAllUsersExceptAdmin = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: {
      role: {
        not: "Admin",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (!users) {
    throw new ApiError(404, "No users found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully", users));
});

export const editUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  let updatedData = {};

  if (name) {
    updatedData.name = name;
  }

  if (email) {
    updatedData.email = email;

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      throw new ApiError(400, "User already exists with this email");
    }
  }

  if (password) {
    validatePassword(password);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    updatedData.password = hashedPassword;
  }

  if (role) {
    updatedData.role = role;
  }

  const user = await prisma.user.update({ where: { id }, data: updatedData });

  if (!user) {
    throw new ApiError(404, "User not found or already deleted");
  }

  res.status(200).json(new ApiResponse(200, "User updated successfully"));
});

// Delete user
export const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.delete({ where: { id } });

  if (!user) {
    throw new ApiError(404, "User not found or already deleted");
  }

  res.status(200).json(new ApiResponse(200, "User deleted successfully"));
});

export const GetActiveStatus = asyncHandler(async (req, res) => {
  const activeRecord = await prisma.active.findFirst();
  const isActive = activeRecord ? activeRecord.status : false;

  return res
    .status(200)
    .json(new ApiResponse(200, "Active status fetched", isActive));
});

// Change admin password controller
export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Check if all required fields are provided
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  // Get the current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Validate new password
  validatePassword(newPassword);

  // Hash the new password
  const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update the password
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  if (!updatedUser) {
    throw new ApiError(500, "Failed to update password");
  }

  res.status(200).json(new ApiResponse(200, "Password changed successfully"));
});
