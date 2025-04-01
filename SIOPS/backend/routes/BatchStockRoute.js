import express from "express";
import {
    getBatchStok,
    getBatchStokById,
    getBatchStokByProductCode,
} from "../controller/BatchStockController.js";
// import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

router.get('/stock', getBatchStok);
router.get('/:batch_id',  getBatchStokById);
router.get('/product/:product_code',  getBatchStokByProductCode);


export default router;
