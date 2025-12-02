import { Router } from "express";
import {
  checkAuth,
  changeAdminPassword,
  createRole,
  deleteUserByAdmin,
  editUser,
  GetActiveStatus,
  getAllUsersExceptAdmin,
  GetLoggedInUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/users.controllers.js";
import {
  getUserLimit,
  updateUserLimit,
} from "../controllers/userLimit.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/active-status", GetActiveStatus);

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secure route
router.route("/logout").post(verifyJWTToken, logoutUser);
router.route("/get-user").get(verifyJWTToken, GetLoggedInUser);
router.route("/check-auth").get(verifyJWTToken, checkAuth);
router.route("/create-role").post(verifyJWTToken, createRole);

router.route("/users").get(verifyJWTToken, getAllUsersExceptAdmin);
router.route("/users/:id").put(verifyJWTToken, editUser);
router.route("/users/:id").delete(verifyJWTToken, deleteUserByAdmin);

// User limit routes
router.route("/user-limit").get(verifyJWTToken, getUserLimit);
router.route("/user-limit/:id").put(verifyJWTToken, updateUserLimit);

// Change admin password route
router.route("/change-password").put(verifyJWTToken, changeAdminPassword);

export default router;
