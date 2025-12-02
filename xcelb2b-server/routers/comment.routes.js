import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getAllComments,
  getOneComment,
  updateComment,
} from "../controllers/comment.controllers.js";

const router = Router();

// Create a new comment
router.post("/", verifyJWTToken, createComment);

// Get all comments for a lead
router.get("/lead/:lead_id", verifyJWTToken, getAllComments);

// Specific comment routes
router
  .route("/:id")
  .get(verifyJWTToken, getOneComment)
  .put(verifyJWTToken, updateComment)
  .delete(verifyJWTToken, deleteComment);

export default router;
