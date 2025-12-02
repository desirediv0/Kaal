import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";
import {
  createProducts,
  deleteProduct,
  getAllProducts,
  getOneProduct,
  searchProducts,
  updateProduct,
  getAllProductsLength,
  getAllProductsLengthAndDate,
  allProducts,
  deleteProductImage,
  GetProductBySlug,
  userSearchProducts,
} from "../controllers/product.controlers.js";
import { compressImage, upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes with caching
router
  .route("/product/:slug")
  .get(cacheMiddleware(2 * 60 * 1000), GetProductBySlug); // 2 minutes cache
router
  .route("/user-search")
  .get(cacheMiddleware(1 * 60 * 1000), userSearchProducts); // 1 minute cache
router.route("/all").get(cacheMiddleware(3 * 60 * 1000), allProducts); // 3 minutes cache

// Protected routes with caching
router
  .route("/search")
  .get(verifyJWTToken, cacheMiddleware(1 * 60 * 1000), searchProducts); // 1 minute cache
router
  .route("/product-length")
  .get(verifyJWTToken, cacheMiddleware(5 * 60 * 1000), getAllProductsLength); // 5 minutes cache
router
  .route("/length-date")
  .get(
    verifyJWTToken,
    cacheMiddleware(5 * 60 * 1000),
    getAllProductsLengthAndDate
  ); // 5 minutes cache

router
  .route("/")
  .post(
    verifyJWTToken,
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ]),
    compressImage,
    createProducts
  )
  .get(cacheMiddleware(2 * 60 * 1000), getAllProducts); // 2 minutes cache

router
  .route("/:slug")
  .put(
    verifyJWTToken,
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ]),
    compressImage,
    updateProduct
  )
  .get(verifyJWTToken, cacheMiddleware(2 * 60 * 1000), getOneProduct) // 2 minutes cache
  .delete(verifyJWTToken, deleteProduct);

router.route("/delete-image").post(verifyJWTToken, deleteProductImage);

export default router;
