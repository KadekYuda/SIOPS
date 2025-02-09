import express from "express";
import multer from "multer";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    importProducts
} from "../controller/ProductController.js";
import { verifyToken } from "../auth/authMiddleware.js";

const router = express.Router();

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload a CSV file'));
        }
    }
});

// Product routes
router.get('/', verifyToken, getProducts);
router.get('/:kdbar', verifyToken, getProductById);
router.post('/', verifyToken, createProduct);
router.patch('/:kdbar', verifyToken, updateProduct);
router.delete('/:kdbar', verifyToken, deleteProduct);

// CSV import route with error handling
router.post('/import', verifyToken, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ msg: "File upload error" });
        } else if (err) {
            return res.status(400).json({ msg: err.message });
        }
        next();
    });
}, importProducts);

export default router;