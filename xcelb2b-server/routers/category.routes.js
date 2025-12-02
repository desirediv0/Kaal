import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
  getCategoriesLength,
  getCategoriesLengthAndDate,
  getProducts,
  getCategorySubcategories,
  getCategoryWithSubCategories,
} from "../controllers/category.controllers.js";

const router = Router();

// Public routes with caching
router.get("/products", getProducts);
router.get("/with-subcategories", getCategoryWithSubCategories);
router.get("/:category/subcategories", getCategorySubcategories);

// Protected routes with caching
router.route("/length").get(verifyJWTToken, getCategoriesLength);
router.route("/length-date").get(verifyJWTToken, getCategoriesLengthAndDate);

router.route("/").post(verifyJWTToken, createCategory).get(getAllCategories);

router
  .route("/:id")
  .delete(verifyJWTToken, deleteCategory)
  .put(verifyJWTToken, updateCategory);

export default router;
