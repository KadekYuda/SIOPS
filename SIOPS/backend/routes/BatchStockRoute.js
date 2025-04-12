import express from "express";
import {
    getBatchStok,
    getBatchStokById,
    getBatchStokByProductCode,
    getMinimumStockAlert
} from "../controller/BatchStockController.js";
import { authenticateToken } from "../auth/authMiddleware.js";

const router = express.Router();


router.get('/stock', authenticateToken, getBatchStok);
router.get('/minstock', authenticateToken, getMinimumStockAlert)
router.get('/:batch_id',  authenticateToken, getBatchStokById);
router.get('/product/:product_code',  authenticateToken, getBatchStokByProductCode);



export default router;  
