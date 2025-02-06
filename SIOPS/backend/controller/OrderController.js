import Order from "../models/OrderModel.js";
import Products from "../models/ProductModel.js";

// Get all orders
export const getOrders = async (req, res) => {
    try {
        const response = await Order.findAll({
            include: [{
                model: Products,
                attributes: ['kdbar', 'nmbar', 'hjual']
            }],
            order: [['tgl_order', 'DESC']]
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
                attributes: ['kdbar', 'nmbar', 'hjual']
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
        const { kdbar, jumlah, harga, tipe_order, users_id } = req.body;

        if (!kdbar || !jumlah || !harga || !tipe_order || !users_id) {
            return res.status(400).json({
                message: 'Missing required fields',
                errors: {
                    kdbar: !kdbar ? 'Product code is required' : undefined,
                    jumlah: !jumlah ? 'Quantity is required' : undefined,
                    harga: !harga ? 'Price is required' : undefined,
                    tipe_order: !tipe_order ? 'Order type is required' : undefined,
                    users_id: !users_id ? 'User ID is required' : undefined
                }
            });
        }

        // Check if product exists
        const product = await Products.findByPk(kdbar);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const order = await Order.create({
            kdbar,
            jumlah,
            harga,
            tipe_order,
            users_id,
            tgl_order: new Date()
        });

        res.status(201).json(order);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error creating order" });
    }
};

// Update order by ID
export const updateOrder = async (req, res) => {
    try {
        const { kdbar, jumlah, harga, tipe_order } = req.body;
        const order = await Order.findByPk(req.params.order_id);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        await order.update({
            kdbar: kdbar || order.kdbar,
            jumlah: jumlah || order.jumlah,
            harga: harga || order.harga,
            tipe_order: tipe_order || order.tipe_order
        });

        res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error updating order" });
    }
};

// Delete order by ID
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.order_id);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        await order.destroy();
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error deleting order" });
    }
};
