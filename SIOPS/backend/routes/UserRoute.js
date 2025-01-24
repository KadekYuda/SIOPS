import express from "express"
import {
    getUsers, 
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
} from "../controller/UserController.js"
import { authenticateToken, authorizeRole, verifyToken, logout } from "../auth/authMiddleware.js";

const router = express.Router();

// Protected routes
router.get('/users', authenticateToken, authorizeRole('admin'), getUsers);
router.get('/users/:id', authenticateToken, authorizeRole('admin'), getUserById);
router.post('/users', authenticateToken, authorizeRole('admin'), createUser);
router.put('/users/:id', authenticateToken, authorizeRole('admin'), updateUser);
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);

// Auth routes
router.post('/login', loginUser);
router.post('/logout', authenticateToken, logout);
router.get('/verify-token', verifyToken);

export default router;