import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  importProductsFromCSV,
  upload
} from "../controller/ProductCategoriesController.js";
import { authorizeRole, authenticateToken } from "../auth/authMiddleware.js";

const router = express.Router();

// Product routes
router.get("/products", authenticateToken, getProducts);
router.get("/products/:code_product", authenticateToken, getProductById);
router.post("/products", authenticateToken, createProduct);
router.put("/products/:code_product", authenticateToken, authorizeRole(['staff', 'admin']), updateProduct);
router.patch("/products/status/:code_product", authenticateToken, authorizeRole(['admin']), toggleProductStatus);

// Category routes
router.get("/categories", authenticateToken, getCategories); 
router.get("/categories/:code_categories", authenticateToken, getCategoryById);
router.post("/categories", authenticateToken, createCategory);
router.put("/categories/:code_categories", authenticateToken, authorizeRole(['staff', 'admin']), updateCategory);

// CSV routes
router.post("/products/import", upload.single('file'), importProductsFromCSV)
export default router;