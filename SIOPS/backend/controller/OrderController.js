import Order from "../models/OrderModel.js";
import User from "../models/UserModel.js";
import OrderDetail from "../models/OrderDetailsModel.js";
import BatchStock from "../models/BatchstockModel.js";
import Product from "../models/ProductModel.js";
import db from "../config/Database.js";

// Create a new order with order details
export const createOrder = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const { order_status, order_details } = req.body;
        
        // Check if user is authenticated
        if (!req.user || !req.user.user_id) {       
            await t.rollback();
            return res.status(401).json({ msg: "User not authenticated or user_id not found" });
        }
        
        const user_id = req.user.user_id; // Get from authentication middleware
        console.log("Creating order for user_id:", user_id); // Debug log
        
        // Calculate total amount from order details
        let total_amount = 0;
        for (const detail of order_details) {
            total_amount += parseFloat(detail.subtotal);
        }

        // Create the order
        const newOrder = await Order.create({
            user_id,
            order_status: order_status || 'pending',
            total_amount,
            created_at: new Date(),
            updated_at: new Date()
        }, { transaction: t });

        // Process order details and handle batch creation if needed
        const orderDetailsPromises = [];

        // For each detail of order_details
        for (const detail of order_details) {
            // Get product information
            const product = await Product.findByPk(detail.code_product, { transaction: t });
            if (!product) {
                throw new Error(`Product with code ${detail.code_product} not found`);
            }
            
            let batchId = detail.batch_id;

            // If no batch_id is provided, check if we need to create a new batch
            if (!batchId) {
                // Check existing batches
                const existingBatches = await BatchStock.findAll({
                    where: { code_product: detail.code_product },
                    transaction: t
                });
                
                // Find a batch with the same price
                const matchingPriceBatch = existingBatches.find(batch => 
                    parseFloat(batch.purchase_price) === parseFloat(detail.ordered_price)
                );
                
                if (existingBatches.length === 0 || !matchingPriceBatch) {
                    // Create a new batch - either first time or new price
                    const batchNumber = existingBatches.length + 1;
                    const batchCode = `${product.name_product.substring(0, 15)}-${String(batchNumber).padStart(3, '0')}`;
                    const currentDate = new Date();
                    
                    // Default expiry date (1 year from now)
                    const expiryDate = new Date();
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    
                    const newBatch = await BatchStock.create({
                        code_product: detail.code_product,
                        batch_code: batchCode,
                        purchase_price: detail.ordered_price,
                        initial_stock: 0, // Set initial stock to 0, will be updated when order is received
                        stock_quantity: 0,
                        arrival_date: currentDate,
                        exp_date: expiryDate,
                        created_at: currentDate,
                        updated_at: currentDate
                    }, { transaction: t });
                    
                    batchId = newBatch.batch_id;
                } else {
                    // Use the existing batch with matching price
                    batchId = matchingPriceBatch.batch_id;
                }
            }
            
            // Create order detail with the batch_id
            const orderDetail = await OrderDetail.create({
                order_id: newOrder.order_id,
                code_product: detail.code_product,
                batch_id: batchId,
                quantity: detail.stock_quantity,
                ordered_price: detail.ordered_price,
                subtotal: detail.subtotal,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction: t });
            
            orderDetailsPromises.push(orderDetail);
        }

        await Promise.all(orderDetailsPromises);
        await t.commit();
        
        res.status(201).json({ 
            msg: "Order created successfully", 
            order: newOrder 
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ msg: error.message });
    }
};

// Get all orders with their details
export const getAllOrders = async (req, res) => {
    try {
        const { order_status, created_at } = req.query;
        
        // Build where clause
        const whereClause = {};
        if (order_status) {
            whereClause.order_status = order_status;
        }
        if (created_at) {
            whereClause.created_at = {
                [db.Sequelize.Op.gte]: new Date(created_at),
                [db.Sequelize.Op.lt]: new Date(new Date(created_at).setDate(new Date(created_at).getDate() + 1))
            };
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'name', 'email']
                },
                {
                    model: OrderDetail,
                    include: [
                        {
                            model: Product,
                            attributes: ['code_product', 'name_product']
                        },
                        {
                            model: BatchStock,
                            attributes: ['batch_id', 'exp_date', 'batch_code']
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get a single order by ID with details
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                order_id: req.params.id
            },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'name', 'email']
                },
                {
                    model: OrderDetail,
                    include: [
                        {
                            model: Product,
                            attributes: ['code_product', 'name_product']
                        },
                        {
                            model: BatchStock,
                            attributes: ['batch_id', 'exp_date', 'batch_code']
                        }
                    ]
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({ msg: "Order not found" });
        }
        
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get orders by user ID
export const getOrdersByUserId = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: {
                user_id: req.params.userId
            },
            include: [
                {
                    model: OrderDetail,
                    include: [
                        {
                            model: Product,
                            attributes: ['code_product', 'name_product']
                        },
                        {
                            model: BatchStock,
                            attributes: ['batch_id', 'exp_date', 'batch_code']
                        }
                    ]
                }
            ],
            order: [['order_date', 'DESC']]
        });
        
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const { order_status } = req.body;
        const orderId = req.params.id;
        
        // Check if user is admin for status updates
        if (!req.user || req.user.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({ msg: "Only admin can update order status" });
        }

        const order = await Order.findByPk(orderId, {
            include: [{
                model: OrderDetail,
                include: [{ model: BatchStock }]
            }],
            transaction: t
        });
        
        if (!order) {
            await t.rollback();
            return res.status(404).json({ msg: "Order not found" });
        }

        // Handle received status - update stock quantities
        if (order_status === 'received' && order.order_status === 'approved') {
            const orderDetails = await OrderDetail.findAll({
                where: { order_id: orderId },
                transaction: t
            }); 
        
            for (const detail of orderDetails) {
                const batchStock = await BatchStock.findByPk(detail.batch_id, { transaction: t });
                
                if (!batchStock) {
                    await t.rollback();
                    return res.status(400).json({ 
                        msg: `Batch stock not found for order detail ${detail.order_detail_id}` 
                    });
                }
                
                // Update the stock quantity when receiving the order
                await batchStock.increment('stock_quantity', {
                    by: parseInt(detail.quantity),
                    transaction: t
                });

                // Update arrival date when receiving
                await batchStock.update({
                    arrival_date: new Date(),
                    updated_at: new Date()
                }, { transaction: t });
            }
        }
        
        // Update order status
        await order.update({
            order_status,
            updated_at: new Date()
        }, { transaction: t });
        
        await t.commit();
        res.status(200).json({ 
            msg: "Order status updated successfully", 
            order: {
                ...order.toJSON(),
                order_status
            }
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ msg: error.message });
    }
};

// Delete an order (for admin purposes only)
export const deleteOrder = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const orderId = req.params.id;
        const order = await Order.findByPk(orderId, { transaction: t });
        
        if (!order) {
            await t.rollback();
            return res.status(404).json({ msg: "Order not found" });
        }
        
        // If not cancelled, restore the batch stock quantities
        if (order.order_status !== 'cancelled') {
            const orderDetails = await OrderDetail.findAll({
                where: { order_id: orderId },
                transaction: t
            });
            
            for (const detail of orderDetails) {
                const batch = await BatchStock.findByPk(detail.batch_id, { transaction: t });
                if (batch) {
                    // Check if this is a batch that might need to update initial_stock
                    // If batch has no initial_stock but has stock_quantity, it's already been "converted"
                    if (batch.initial_stock === 0 && batch.stock_quantity > 0) {
                        // Normal restore to stock_quantity
                        await batch.update({
                            stock_quantity: batch.stock_quantity + detail.quantity,
                            updated_at: new Date()
                        }, { transaction: t });
                    } else {
                        // This might be a batch that was in its "initial stock" phase
                        // Restore to initial_stock if this batch hasn't been fully transitioned yet
                        await batch.update({
                            initial_stock: batch.initial_stock + detail.quantity,
                            updated_at: new Date()
                        }, { transaction: t });
                    }
                }
            }
        }
        
        // Delete order details first
        await OrderDetail.destroy({
            where: { order_id: orderId },
            transaction: t
        });
        
        // Then delete the order
        await order.destroy({ transaction: t });
        
        await t.commit();
        res.status(200).json({ msg: "Order deleted successfully" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ msg: error.message });
    }
};

export const getOrderDetailsByOrderId = async (req, res) => {
    try {
        // First, log the request to make sure we're getting the right orderId
        // console.log("Fetching details for order ID:", req.params.orderId);
        
        // Fetch order details with explicit joins
        const orderDetails = await OrderDetail.findAll({
            where: {
                order_id: req.params.orderId
            },
            include: [
                {
                    model: Product,
                    required: false, // Use LEFT JOIN to ensure we get results even if product isn't found
                    attributes: ['code_product', 'name_product']
                },
                {
                    model: BatchStock,
                    required: false, // Use LEFT JOIN to ensure we get results even if batch isn't found
                    attributes: ['batch_id', 'batch_code', 'exp_date', 'purchase_price']
                }
            ],
            raw: false // Ensure we get Sequelize model instances, not raw data
        });
        
        // Log what we got back from the database
        console.log("Raw order details from DB:", JSON.stringify(orderDetails, null, 2));
        
        // If we're not getting Product or BatchStock, let's try to fetch them separately
        const formattedOrderDetails = await Promise.all(orderDetails.map(async (detail) => {
            let productData = detail.Product;
            let batchData = detail.BatchStock;
            
            // If Product data is missing, try to fetch it directly
            if (!productData || !productData.name_product) {
                try {
                    productData = await Product.findByPk(detail.code_product);
                    console.log("Fetched product separately:", productData ? productData.name_product : "Not found");
                } catch (err) {
                    console.error("Error fetching product:", err);
                }
            }
            
            // If BatchStock data is missing, try to fetch it directly
            if (!batchData || !batchData.batch_code) {
                try {
                    batchData = await BatchStock.findByPk(detail.batch_id);
                    console.log("Fetched batch separately:", batchData ? batchData.batch_code : "Not found");
                } catch (err) {
                    console.error("Error fetching batch:", err);
                }
            }
            
            return {
                order_detail_id: detail.order_detail_id,
                order_id: detail.order_id,
                product_id: detail.code_product,
                product_name: productData ? productData.name_product : 'Unknown Product',
                code_product: detail.code_product,
                batch_id: detail.batch_id,
                batch_code: batchData ? batchData.batch_code : 'Unknown Batch',
                quantity: detail.quantity,
                ordered_price: detail.ordered_price,
                subtotal: detail.subtotal
            };
        }));
        
        // Log the formatted results
        console.log("Formatted order details:", JSON.stringify(formattedOrderDetails, null, 2));
        
        res.status(200).json({ result: formattedOrderDetails });
    } catch (error) {
        console.error("Error in getOrderDetailsByOrderId:", error);
        res.status(500).json({ msg: error.message });
    }
};


// Get available batches by product code
export const getAvailableBatchesByProductCode = async (req, res) => {
    try {
        const productCode = req.params.code_product; // Tetap menggunakan productId di route untuk kompatibilitas
        
        // Pastikan code_product valid
        const product = await Product.findByPk(productCode);
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }
        
        // Dapatkan semua batch yang tersedia (stock > 0) untuk product ini
        const batches = await BatchStock.findAll({
            where: {
                code_product: productCode, // Menggunakan code_product bukan product_id
                stock_quantity: {
                    [db.Sequelize.Op.gte]: 0  // stock harus lebih dari 0
                }
            },
            attributes: ['batch_id', 'batch_code', 'stock_quantity', 'purchase_price', 'exp_date'],
            order: [['exp_date', 'ASC']]  // Sort by expiration date ascending
        });
        
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Update order item
export const updateOrderItem = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const orderId = req.params.id;
        const orderDetailId = req.params.detailId;
        const { batch_id, quantity, ordered_price, subtotal } = req.body;
        
        // Cek apakah order ada dan statusnya pending
        const order = await Order.findByPk(orderId, { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({ msg: "Order not found" });
        }
        
        if (order.order_status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ msg: "Only pending orders can be modified" });
        }
        
        // Cek apakah order detail ada
        const orderDetail = await OrderDetail.findByPk(orderDetailId, { transaction: t });
        if (!orderDetail) {
            await t.rollback();
            return res.status(404).json({ msg: "Order detail not found" });
        }
        
        // Jika batch berubah atau quantity berubah, perbarui stok
        if (orderDetail.batch_id !== batch_id || orderDetail.quantity !== quantity) {
            // Kembalikan stok yang lama
            const oldBatch = await BatchStock.findByPk(orderDetail.batch_id, { transaction: t });
            if (oldBatch) {
                await oldBatch.update({
                    stock_quantity: oldBatch.stock_quantity + orderDetail.quantity,
                    updated_at: new Date()
                }, { transaction: t });
            }
            
            // Kurangi stok yang baru
            const newBatch = await BatchStock.findByPk(batch_id, { transaction: t });
            if (!newBatch) {
                await t.rollback();
                return res.status(404).json({ msg: "Batch not found" });
            }
            
            if (newBatch.stock_quantity < quantity) {
                await t.rollback();
                return res.status(400).json({ msg: "Insufficient stock for the selected batch" });
            }
            
            await newBatch.update({
                stock_quantity: newBatch.stock_quantity - quantity,
                updated_at: new Date()
            }, { transaction: t });
        }
        
        // Update order detail
        await orderDetail.update({
            batch_id,
            quantity,
            ordered_price,
            subtotal,
            updated_at: new Date()
        }, { transaction: t });
        
        // Recalculate and update order total amount
        const allOrderDetails = await OrderDetail.findAll({
            where: { order_id: orderId },
            transaction: t
        });
        
        let newTotalAmount = 0;
        for (const detail of allOrderDetails) {
            // Use the updated value for the current detail we're updating
            if (detail.order_detail_id === parseInt(orderDetailId)) {
                newTotalAmount += parseFloat(subtotal);
            } else {
                newTotalAmount += parseFloat(detail.subtotal);
            }
        }
        
        await order.update({
            total_amount: newTotalAmount,
            updated_at: new Date()
        }, { transaction: t });
        
        await t.commit();
        res.status(200).json({ 
            msg: "Order item updated successfully",
            orderDetail: {
                ...orderDetail.toJSON(),
                quantity,
                ordered_price,
                subtotal
            } 
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ msg: error.message });
    }
};