import { Router } from "express";
import {
  allLeads,
  createLead,
  deleteLead,
  getAllLeads,
  getLeadsLength,
  getLeadsLengthAndDate,
  getOneLead,
  recentLeads,
  searchLeads,
  updateLead,
} from "../controllers/lead.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Search route
router.get("/search", verifyJWTToken, searchLeads);

// Main routes
router.route("/").post(createLead).get(getAllLeads);

router.get(
  "/recent",
  verifyJWTToken,

  recentLeads
);

router.get("/all", verifyJWTToken, allLeads);
router.get("/leads-length", verifyJWTToken, getLeadsLength);
router.get("/length-date", verifyJWTToken, getLeadsLengthAndDate);

// Specific lead routes
router
  .route("/:slug")
  .get(verifyJWTToken, getOneLead)
  .put(verifyJWTToken, updateLead)
  .delete(verifyJWTToken, deleteLead);

export default router;
