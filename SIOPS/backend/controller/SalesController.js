import Sales from "../models/SalesModel.js";
import SalesDetail from "../models/SalesDetailModel.js";
import BatchStock from "../models/BatchstockModel.js";
import Product from "../models/ProductModel.js";
import db from "../config/Database.js";
import fs from "fs";
import { parse } from "csv-parse";
import path from "path";
import multer from "multer";

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "text/csv") {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});




// Helper function to validate and normalize product code
const normalizeProductCode = (code) => {
    if (!code) return null;
    
    // Convert to string first
    let strCode = String(code);
    
    // If it's in scientific notation, convert to full number
    if (strCode.toLowerCase().includes('e')) {
        try {
            strCode = Number(strCode).toFixed(0);
        } catch (error) {
            console.error('Error converting scientific notation:', error);
            return null;
        }
    }
    
    // Remove any remaining decimals and clean the string
    return strCode.replace(/\.0+$/, '').trim();
};

// Helper function to validate stock availability
const validateStockAvailability = async (items, t) => {
    const stockValidation = [];
    
    for (const item of items) {
        const code_product = normalizeProductCode(item.code_product);
        const quantity = parseInt(item.quantity);

        // Get total available stock
        const availableBatches = await BatchStock.findAll({
            where: {
                code_product,
                stock_quantity: {
                    [db.Sequelize.Op.gt]: 0
                }
            },
            transaction: t
        });

        const totalStock = availableBatches.reduce((sum, batch) => 
            sum + parseInt(batch.stock_quantity || 0), 0);

        stockValidation.push({
            code_product,
            available: totalStock,
            requested: quantity,
            sufficient: totalStock >= quantity
        });
    }

    return stockValidation;
};

// Helper to group sales data by date
const groupSalesByDate = (salesData) => {
    return salesData.reduce((acc, item) => {
        const date = item.sales_date;
        if (!acc[date]) {
            acc[date] = {
                sales_date: date,
                items: []
            };
        }
        acc[date].items.push(item);
        return acc;
    }, {});
};

// Helper to process a single sale item
const processSaleItem = async (item, sale_id, user_id, t) => {
    let remainingQuantity = parseInt(item.quantity);

    // Get batches in FIFO order
    const availableBatches = await BatchStock.findAll({
        where: {
            code_product: item.code_product,
            stock_quantity: {
                [db.Sequelize.Op.gt]: 0
            }
        },
        order: [
            ['exp_date', 'ASC'],
            ['arrival_date', 'ASC']
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
    });

    // Process each batch until quantity is fulfilled
    for (const batch of availableBatches) {
        if (remainingQuantity <= 0) break;

        const batchStock = parseInt(batch.stock_quantity);
        const quantityToDeduct = Math.min(remainingQuantity, batchStock);

        if (quantityToDeduct > 0) {
            // Create sales detail
            await SalesDetail.create({
                sales_id: sale_id, // pastikan ini sale_id, bukan sales_id
                code_product: item.code_product,
                batch_id: batch.batch_id,
                quantity: quantityToDeduct,
                selling_price: item.selling_price,
                subtotal: quantityToDeduct * item.selling_price,
                created_by: user_id,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction: t });

            // Update batch stock
            await batch.update({
                stock_quantity: batchStock - quantityToDeduct,
                updated_at: new Date()
            }, { transaction: t });

            remainingQuantity -= quantityToDeduct;
        }
    }

    return remainingQuantity === 0;
};

// Helper to process a single day's sales
const processDailySale = async (date, saleData, user_id, t) => {
    // Create sale record
    const sale = await Sales.create({
        user_id,
        sales_date: new Date(date),
        total_amount: saleData.total_amount,
        created_at: new Date(),
        updated_at: new Date()
    }, { transaction: t });

    // Process each item
    for (const item of saleData.items) {
        const success = await processSaleItem(item, sale.sales_id, user_id, t);
        if (!success) {
            throw new Error(`Failed to process item ${item.code_product}`);
        }
    }

    return {
        sale_id: sale.sales_id,
        date: date,
        total_amount: saleData.total_amount
    };
};

// Helper to create a single sale with its items
const createSingleSale = async (saleData, user_id, normalizedItems, t) => {
    // Create the sale record
    console.log('Creating sale with data:', {
        user_id,
        sales_date: saleData.sales_date,
        total_amount: normalizedItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
    });
    
    const sale = await Sales.create({
        user_id,
        sales_date: new Date(saleData.sales_date),
        total_amount: normalizedItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0),
        created_at: new Date(),
        updated_at: new Date()
    }, { transaction: t });
    
    console.log('Created sale:', sale.toJSON());

    // Process each item
    for (const item of normalizedItems) {
        const success = await processSaleItem(item, sale.sales_id, user_id, t);
        if (!success) {
            throw new Error(`Failed to process product ${item.code_product}`);
        }
    }

    return sale;
};

export const importSalesFromCSV = async (req, res) => {
    const t = await db.transaction();
    
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "File tidak ditemukan" });
        }

        const user_id = req.user?.user_id;
        if (!user_id) {
            await t.rollback();
            return res.status(401).json({ msg: "User ID is required" });
        }

        let processedCount = 0;
        let successCount = 0;
        const errors = [];
        const salesData = [];
        const startTime = Date.now();

        // Read CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(parse({
                    delimiter: ",",
                    columns: (header) => {
                        const csvColumns = header.map(h => h.trim());
                        console.log('CSV columns detected:', csvColumns);
                        
                        // Validate required columns
                        const requiredColumns = ['Tanggal', 'Kode Barang', 'Jumlah', 'Harga Jual'];
                        const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));
                        
                        if (missingColumns.length > 0) {
                            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
                            return false;
                        }
                        return csvColumns;
                    },
                    trim: true,
                    skip_empty_lines: true
                }))
                .on("data", (row) => {
                    processedCount++;
                    try {
                        // Transform and validate row data
                        const code_product = normalizeProductCode(row['Kode Barang']);
                        if (!code_product) {
                            errors.push({
                                row: processedCount,
                                error: 'Product code is required'
                            });
                            return;
                        }

                        const quantity = parseInt(row['Jumlah']);
                        if (isNaN(quantity) || quantity <= 0) {
                            errors.push({
                                row: processedCount,
                                error: 'Invalid quantity'
                            });
                            return;
                        }

                        const selling_price = parseFloat(row['Harga Jual'].replace(/,/g, '.'));
                        if (isNaN(selling_price) || selling_price <= 0) {
                            errors.push({
                                row: processedCount,
                                error: 'Invalid selling price'
                            });
                            return;
                        }

                        const sales_date = new Date(row['Tanggal']);
                        if (isNaN(sales_date.getTime())) {
                            errors.push({
                                row: processedCount,
                                error: 'Invalid date format'
                            });
                            return;
                        }

                        salesData.push({
                            sales_date,
                            code_product,
                            quantity,
                            selling_price,
                            subtotal: quantity * selling_price
                        });

                    } catch (error) {
                        errors.push({
                            row: processedCount,
                            error: `Error processing row: ${error.message}`
                        });
                    }
                })
                .on("error", (error) => reject(error))
                .on("end", () => resolve());
        });

        // Delete uploaded file
        fs.unlinkSync(req.file.path);

        if (salesData.length === 0) {
            await t.rollback();
            return res.status(400).json({
                msg: "No valid data found in CSV",
                errors
            });
        }

        // Group sales by date
        const salesByDate = groupSalesByDate(salesData);

        // Validate all stock before processing
        const allItems = Object.values(salesByDate).flatMap(sale => sale.items);
        const stockValidation = await validateStockAvailability(allItems, t);
        
        const insufficientStock = stockValidation.filter(v => !v.sufficient);
        if (insufficientStock.length > 0) {
            await t.rollback();
            return res.status(400).json({
                msg: "Insufficient stock for some products",
                details: insufficientStock
            });
        }

        // Process each day's sales
        const results = [];
        for (const [date, saleData] of Object.entries(salesByDate)) {
            try {
                const sale = await createSingleSale(
                    { sales_date: new Date(date) },
                    user_id,
                    saleData.items,
                    t
                );
                results.push(sale);
                successCount++;
            } catch (error) {
                errors.push({
                    date,
                    error: `Error processing sale: ${error.message}`
                });
            }
        }

        // If we have any successful imports but some failed, we still commit
        if (successCount > 0) {
            await t.commit();
        } else {
            await t.rollback();
            return res.status(400).json({
                msg: "No sales were successfully imported",
                errors
            });
        }

        const elapsed = (Date.now() - startTime) / 1000;
        return res.json({
            msg: `Import completed: ${successCount} sales created from ${processedCount} rows`,
            success_count: successCount,
            total_rows: processedCount,
            error_count: errors.length,
            elapsed_time: `${elapsed.toFixed(2)} seconds`,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        await t.rollback();
        console.error('Import error:', error);
        return res.status(500).json({
            msg: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const createSale = async (req, res) => {
    const t = await db.transaction();
    
    try {
        const { sales_date, items } = req.body;
        const user_id = req.user?.user_id;

        // Basic validation
        if (!user_id) {
            await t.rollback();
            return res.status(401).json({ msg: "User ID is required" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ msg: "Items array is required" });
        }

        // Normalize items
        const normalizedItems = items.map(item => ({
            ...item,
            code_product: normalizeProductCode(item.code_product)
        }));

        // Validate stock
        const stockValidation = await validateStockAvailability(normalizedItems, t);
        const insufficientStock = stockValidation.filter(v => !v.sufficient);
        
        if (insufficientStock.length > 0) {
            await t.rollback();
            return res.status(400).json({
                msg: "Insufficient stock for some products",
                details: insufficientStock
            });
        }

        // Create sale with validated data
        const sale = await createSingleSale({ sales_date }, user_id, normalizedItems, t);
        
        // Verify the sale was created successfully
        if (!sale) {
            await t.rollback();
            return res.status(500).json({ msg: "Failed to create sale record" });
        }

        // Get the sales_id from the created sale
        const { sales_id } = sale;
        if (!sales_id) {
            await t.rollback();
            return res.status(500).json({ msg: "Sale record created but sales_id is missing" });
        }
        
        await t.commit();
        
        // Return success response with sales_id (frontend expects sales_id)
        return res.status(201).json({ 
            msg: "Sale created successfully", 
            sales_id: sales_id
        });

    } catch (error) {
        await t.rollback();
        console.error('Sale creation error:', error);
        return res.status(500).json({ 
            msg: error.message || "An error occurred while creating the sale"
        });
    }
};

export const getSales = async (req, res) => {
    try {
        const response = await Sales.findAll({
            include: [{
                model: SalesDetail,
                include: [{
                    model: Product,
                    attributes: ['name_product']
                }, {
                    model: BatchStock,
                    attributes: ['batch_code', 'exp_date']
                }]
            }],
            order: [['sales_date', 'DESC']]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const sale = await Sales.findOne({
            where: { sales_id: req.params.id },
            include: [{
                model: SalesDetail,
                include: [{
                    model: Product,
                    attributes: ['code_product', 'name_product']
                }, {
                    model: BatchStock,
                    attributes: ['batch_code', 'exp_date']
                }]
            }]
        });
        
        if (!sale) {
            return res.status(404).json({ msg: "Sale not found" });
        }
        
        res.status(200).json(sale);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};