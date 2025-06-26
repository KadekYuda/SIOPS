import express from "express";
import {
  createOpnameTasks,
  getTasksForUser,
  submitOpnameResult,
  reviewAndAdjustOpname,
  directOpnameByAdmin,
  getAllOpnames,
  confirmDirectOpname,
} from "../controller/OpnameController.js";
import { authenticateToken, authorizeRole } from "../auth/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authenticateToken,
  authorizeRole(["admin"]),
  createOpnameTasks
);
router.get(
  "/tasks",
  authenticateToken,
  authorizeRole(["staff"]),
  getTasksForUser
);
router.post(
  "/submit",
  authenticateToken,
  authorizeRole(["staff"]),
  submitOpnameResult
);
router.post(
  "/review",
  authenticateToken,
  authorizeRole(["admin"]),
  reviewAndAdjustOpname
);
router.post(
  "/direct-opname",
  authenticateToken,
  authorizeRole(["admin"]),
  directOpnameByAdmin
);
router.get("/all", authenticateToken, getAllOpnames);
router.post(
  "/confirm",
  authenticateToken,
  authorizeRole(["admin"]),
  confirmDirectOpname
);

export default router;