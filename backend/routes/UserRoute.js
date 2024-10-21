import express from "express"
import {
    getUsers, 
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
} from "../controller/UserController.js"
import { authenticateToken, authorizeRole } from "../auth/authMiddleware.js";


const router = express.Router();

router.get('/users', getUsers);
router.get('/users/:id', authenticateToken, authorizeRole('admin'), getUserById);
router.post('/users', authenticateToken, authorizeRole('admin'), createUser);
router.put('/users/:id', authenticateToken, authorizeRole('admin'), updateUser);
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);

router.post('/login', loginUser);
    



export default router;