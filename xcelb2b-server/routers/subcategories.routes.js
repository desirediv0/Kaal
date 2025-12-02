import { Router } from "express";
import {
  createSubCategory,
  getAllSubCategories,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategoryProducts,
  getSubcategoriesByCategory,
  getSubcategoryInfoByName,
} from "../controllers/subcategories.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { compressImage, upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes with caching
router.get("/products", getSubCategoryProducts);
router.get(
  "/by-category",

  getSubcategoriesByCategory
);
router.get(
  "/info/:name",

  getSubcategoryInfoByName
);

router.use(verifyJWTToken);

router
  .route("/")
  .post(upload.single("image"), compressImage, createSubCategory)
  .get(getAllSubCategories);
router
  .route("/:id")
  .get(getSubCategory)
  .patch(upload.single("image"), compressImage, updateSubCategory)
  .delete(deleteSubCategory);

export default router;
