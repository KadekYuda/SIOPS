// backend/routes/opnameRoutes.js
import express from 'express';
import { authenticateToken, authorizeRole, authorizeAssignedStaff } from '../auth/authMiddleware.js';
import * as opnameController from '../controller/OpnameController.js';

const router = express.Router();

// Route untuk admin membuat penugasan opname
router.post('/create', authenticateToken, authorizeRole('admin'), opnameController.createOpnameTasks);

// Route untuk staff melihat tugas yang ditugaskan kepadanya
router.get('/tasks', authenticateToken, authorizeRole('staff'), opnameController.getTasksForUser);

// Route untuk staff mengirimkan hasil opname
router.post('/submit/:id', authenticateToken, authorizeRole('staff'), authorizeAssignedStaff, opnameController.submitOpnameResult);

// Route untuk admin mereview dan menyesuaikan stok
router.post('/review', authenticateToken, authorizeRole('admin'), opnameController.reviewAndAdjustOpname);

// Route untuk admin melihat semua opname
router.get('/', authenticateToken, authorizeRole('admin'), opnameController.getAllOpnames);

export default router;