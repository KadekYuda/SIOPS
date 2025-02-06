import express from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    getUserProfile
} from "../controller/UserController.js";
import { authenticateToken, authorizeRole, verifyToken, logout } from "../auth/authMiddleware.js";

const router = express.Router();

// Auth routes
router.post('/login', loginUser);
router.post('/logout', authenticateToken, logout);
router.get('/verify-token', verifyToken);

// Profile route - should be before the :user_id routes to avoid conflict
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ msg: "Error fetching profile" });
    }
});

router.get('/profile', verifyToken, getUserProfile);

// Protected routes for users
router.get('/', authenticateToken, authorizeRole('admin'), getUsers);
router.get('/:user_id', authenticateToken, authorizeRole('admin'), getUserById);
router.post('/', authenticateToken, authorizeRole('admin'), createUser);
router.put('/:user_id', authenticateToken, authorizeRole('admin'), updateUser);
router.delete('/:user_id', authenticateToken, authorizeRole('admin'), deleteUser);



export default router;