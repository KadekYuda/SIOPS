import express from "express";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controller/CategoryController.js";
import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

router.get('/', verifyToken, getCategories);
router.get('/:id', verifyToken, getCategoryById);
router.post('/', verifyToken, createCategory);
router.patch('/:id', verifyToken, updateCategory);
router.delete('/:id', verifyToken, deleteCategory);

export default router;
