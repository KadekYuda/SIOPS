import express from "express";
import multer from "multer";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    importProductsFromCSV
} from "../controller/ProductController.js";
import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Product routes
router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);
router.post('/', verifyToken, createProduct);
router.patch('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);
router.post('/import', verifyToken, upload.single('file'), importProductsFromCSV);

export default router;