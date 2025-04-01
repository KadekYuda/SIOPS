    import express from "express";
    import {
        getUsers,
        getUserById,
        createUser,
        updateUser,
        loginUser,
        getUserProfile,
    } from "../controller/UserController.js";
    import { authenticateToken, authorizeRole, authorizeUserOrAdmin, verifyToken, logout } from "../auth/authMiddleware.js";

    const router = express.Router();

    // Auth routes
    router.post('/login', loginUser);
    router.post('/logout', authenticateToken, logout);
    router.get('/verify-token', verifyToken);
    
    // Profile route - should be before the :user_id routes to avoid conflict
    router.get('/profile',  authenticateToken, getUserProfile, async (req, res) => {
        try {
            const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

            res.json({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone_number: user.phone_number
            });
        } catch (error) {
        return res.status(500).json({ msg: "Error fetching profile" });
        }
    });



    // Protected routes for users
    router.get('/', authenticateToken, authorizeRole('admin'), getUsers);
    router.get('/:user_id', authenticateToken, authorizeRole('admin'), getUserById);
    router.post('/', authenticateToken, authorizeRole('admin'), createUser);
    router.put('/:user_id', authenticateToken, authorizeUserOrAdmin, updateUser);




    export default router;