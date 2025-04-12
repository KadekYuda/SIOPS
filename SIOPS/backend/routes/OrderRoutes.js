import express from "express";
import {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder
} from "../controller/OrderController.js";
import { authenticateToken } from "../auth/authMiddleware.js";

const router = express.Router();


router.get('/', 
  authenticateToken, 
  getOrders
);

router.get('/:order_id', 
  authenticateToken, 
  getOrderById
);

router.post('/', 
  authenticateToken, 
  createOrder
);

router.patch('/:order_id', 
  authenticateToken, 
  updateOrder
);

router.delete('/:order_id', 
  authenticateToken, 
  deleteOrder
);

export default router;
