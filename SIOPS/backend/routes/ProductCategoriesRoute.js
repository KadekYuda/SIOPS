import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  upload,
  importProductsFromCSV,
} from "../controller/ProductCategoriesController.js";
import { authorizeRole, authenticateToken } from "../auth/authMiddleware.js";

const router = express.Router();

// Product routes
router.get("/products", authenticateToken, getProducts);
router.get("/products/:id", authenticateToken, getProductById);
router.post("/products", authenticateToken, createProduct);
router.put("/products/:id", authenticateToken, updateProduct, authorizeRole('admin'));
router.delete("/products/:id", authenticateToken, deleteProduct, authorizeRole('admin'));

// Category routes
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory, authorizeRole('admin'));
router.delete("/categories/:id", deleteCategory, authorizeRole('admin'));

// CSV routes
router.post("/products/import", upload.single('file'), importProductsFromCSV)
export default router;