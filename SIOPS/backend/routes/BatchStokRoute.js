import express from "express";
import {
    getBatchStok,
    getBatchStokById,
    createBatchStok,
    updateBatchStok,
    deleteBatchStok
} from "../controller/BatchStokController.js";
import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

router.get('/', verifyToken, getBatchStok);
router.get('/:batch_id', verifyToken, getBatchStokById);
router.post('/', verifyToken, createBatchStok);
router.patch('/:batch_id', verifyToken, updateBatchStok);
router.delete('/:batch_id', verifyToken, deleteBatchStok);

export default router;
