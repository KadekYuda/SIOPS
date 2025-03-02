import Order from "../models/OrderModel.js";
import Products from "../models/ProductModel.js";

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const response = await Order.findAll({
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product', 'sell_price']
            }],
            order: [['order_date', 'DESC']]
        });
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const response = await Order.findOne({
            where: { order_id: req.params.order_id },
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product', 'sell_price']
            }]
        });
        if (!response) return res.status(404).json({ message: "Order not found" });
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error fetching order" });
    }
};

// Create new order
export const createOrder = async (req, res) => {
    try {
        const { code_product, quantity, price, user_id } = req.body;

        if (!code_product || !quantity || !price || !user_id) {
            return res.status(400).json({
                message: 'Missing required fields',
                errors: {
                    code_product: !code_product ? 'Product code is required' : undefined,
                    quantity: !quantity ? 'Quantity is required' : undefined,
                    price: !price ? 'Price is required' : undefined,
                    user_id: !user_id ? 'User ID is required' : undefined
                }
            });
        }

        const order = await Order.create({
            code_product,
            quantity,
            price,
            user_id,
            date_order: new Date()
        });

        const response = await Order.findOne({
            where: { order_id: order.order_id },
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product', 'sell_price']
            }]
        });

        res.status(201).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error creating order" });
    }
};

// Update order by ID
export const updateOrder = async (req, res) => {
    try {
        const { code_product, quantity, price } = req.body;
        const order = await Order.findOne({
            where: { order_id: req.params.order_id }
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        await Order.update({
            code_product: code_product || order.code_product,
            quantity: quantity || order.quantity,
            price: price || order.price
        }, {
            where: { order_id: req.params.order_id }
        });

        const response = await Order.findOne({
            where: { order_id: req.params.order_id },
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product', 'sell_price']
            }]
        });

        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error updating order" });
    }
};

// Delete order by ID
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { order_id: req.params.order_id }
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        await Order.destroy({
            where: { order_id: req.params.order_id }
        });

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error deleting order" });
    }
};
