import { Router } from "express";
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  updateBannerPosition,
  assignPositionsToBanners,
} from "../controllers/banner.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/banner.multer.middleware.js";

const router = Router();

router.get("/", getActiveBanners);

router
  .route("/banners")
  .post(verifyJWTToken, upload.single("image"), createBanner)
  .get(getAllBanners);

router
  .route("/banners/:id")
  .get(getBannerById)
  .put(verifyJWTToken, upload.single("image"), updateBanner)
  .delete(verifyJWTToken, deleteBanner);

router.route("/banners/:id/position").put(verifyJWTToken, updateBannerPosition);

// New route to assign positions to banners with position 0
router.get("/assign-positions", verifyJWTToken, assignPositionsToBanners);

export default router;
