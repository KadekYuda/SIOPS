import express from "express";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controller/CategoriesController.js";
import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

router.get('/', verifyToken, getCategories);
router.get('/:kdkel', verifyToken, getCategoryById);
router.post('/', verifyToken, createCategory);
router.patch('/:kdkel', verifyToken, updateCategory);
router.delete('/:kdkel', verifyToken, deleteCategory);

export default router;
