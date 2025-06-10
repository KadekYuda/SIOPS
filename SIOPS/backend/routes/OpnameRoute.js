// backend/routes/opnameRoutes.js
import express from 'express';
import { authenticateToken, authorizeRole, authorizeAssignedStaff } from '../auth/authMiddleware.js';
import * as opnameController from '../controller/OpnameController.js';

const router = express.Router();

router.post('/opnames/create', authenticateToken, authorizeRole('admin'), opnameController.createOpnameTasks);
router.get('/opnames/tasks', authenticateToken, opnameController.getTasksForUser);
router.post('/opnames/submit', authenticateToken, opnameController.submitOpnameResult);
router.post('/opnames/review', authenticateToken, authorizeRole('admin'), opnameController.reviewAndAdjustOpname);
router.post('/opnames/direct-opname', authenticateToken, authorizeRole('admin'), opnameController.directOpnameByAdmin);
router.get('/opnames', authenticateToken, authorizeRole('admin'), opnameController.getAllOpnames);

export default router;