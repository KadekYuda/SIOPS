import express from "express";
import {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder
} from "../controller/OrderController.js";
import { authenticateToken, authorizeRole } from "../auth/authMiddleware.js";

const router = express.Router();

// Middleware to allow multiple roles
const allowMultipleRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  };
};

// Protected routes for orders with multiple role support
router.get('/', 
  authenticateToken, 
  allowMultipleRoles(['admin', 'staff',]), 
  getOrders
);

router.get('/:order_id', 
  authenticateToken, 
  allowMultipleRoles(['admin', 'staff',]), 
  getOrderById
);

router.post('/', 
  authenticateToken, 
  allowMultipleRoles(['admin', 'staff']), 
  createOrder
);

router.patch('/:order_id', 
  authenticateToken, 
  allowMultipleRoles(['admin', 'staff']), 
  updateOrder
);

router.delete('/:order_id', 
  authenticateToken, 
  allowMultipleRoles(['admin']), 
  deleteOrder
);

export default router;
