import express from "express";
import {
    getBatchStok,
    getBatchStokById,
    getBatchStokByProductCode,
    createBatchStok,
    updateBatchStok,
    deleteBatchStok
} from "../controller/BatchStockController.js";
import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

router.get('/', verifyToken, getBatchStok);
router.get('/:batch_id', verifyToken, getBatchStokById);
router.get('/product/:product_code', verifyToken, getBatchStokByProductCode);
router.post('/', verifyToken, createBatchStok);
router.patch('/:batch_id', verifyToken, updateBatchStok);
router.delete('/:batch_id', verifyToken, deleteBatchStok);

export default router;
