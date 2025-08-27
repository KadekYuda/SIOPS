import Sales from "../models/SalesModel.js";
import SalesDetail from "../models/SalesDetailModel.js";
import BatchStock from "../models/BatchstockModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import db from "../config/Database.js";
import fs from "fs";
import { parse } from "csv-parse";
import path from "path";
import multer from "multer";
// Make sure the Sequelize operators are explicitly defined
const { Op } = db.Sequelize;


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
    
    // Remove quote prefixes from CSV (Excel sometimes adds quotes to preserve leading zeros)
    strCode = strCode.replace(/^['"`]+/, '').replace(/['"`]+$/, '');
    
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

// Helper function for flexible date parsing
const parseDateFlexible = (dateInput) => {
    if (!dateInput) return null;
    
    const input = String(dateInput).trim();
    if (!input) return null;
    
    // Try direct Date parsing first
    let date = new Date(input);
    if (!isNaN(date.getTime())) {
        return date;
    }
    
    // Try common Indonesian date formats
    const formats = [
        // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
        // YYYY/MM/DD or YYYY-MM-DD
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
        // DD/MM/YY or DD-MM-YY
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/
    ];
    
    for (const format of formats) {
        const match = input.match(format);
        if (match) {
            let day, month, year;
            
            if (format.source.startsWith('^(\\d{4})')) {
                // YYYY/MM/DD format
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1; // Month is 0-based
                day = parseInt(match[3]);
            } else if (format.source.includes('(\\d{2})$')) {
                // DD/MM/YY format
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                year = parseInt(match[3]);
                // Assume 20xx for years 00-30, 19xx for years 31-99
                year += (year <= 30) ? 2000 : 1900;
            } else {
                // DD/MM/YYYY format
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                year = parseInt(match[3]);
            }
            
            date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    
    // Try Excel serial date (number of days since 1900-01-01)
    const numericInput = parseFloat(input);
    if (!isNaN(numericInput) && numericInput > 0) {
        // Excel date serial number
        const excelEpoch = new Date(1900, 0, 1);
        date = new Date(excelEpoch.getTime() + (numericInput - 1) * 24 * 60 * 60 * 1000);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    return null;
};

// Helper function to validate stock availability
const validateStockAvailability = async (items, t) => {
    // Group items by code_product (or name_product if fallback)
    const groupMap = {};
    for (const item of items) {
        let code_product = normalizeProductCode(item.code_product);
        let product = null;
        if (code_product) {
            product = await Product.findOne({ where: { code_product }, transaction: t });
        }
        if ((!product || !code_product) && item.name_product) {
            product = await Product.findOne({ where: { name_product: item.name_product }, transaction: t });
            if (product) {
                code_product = product.code_product;
            }
        }
        const key = code_product || item.name_product;
        // --- FIX: Only sum quantity, never subtotal, and avoid double counting ---
        if (!groupMap[key]) {
            groupMap[key] = {
                code_product,
                name_product: item.name_product,
                requested: 0
            };
        }
        // Make sure to only sum the quantity as integer
        groupMap[key].requested += Number(item.quantity);
    }
    // Validate stock per product
    const stockValidation = [];
    for (const key in groupMap) {
        const { code_product, name_product, requested } = groupMap[key];
        // Get total available stock
        const availableBatches = await BatchStock.findAll({
            where: {
                code_product,
                stock_quantity: {
                    [Op.gt]: 0
                }
            },
            transaction: t
        });
        const totalStock = availableBatches.reduce((sum, batch) => sum + parseInt(batch.stock_quantity || 0), 0);
        stockValidation.push({
            code_product,
            name_product,
            available: totalStock,
            requested, // this is now the correct total quantity requested per product
            sufficient: totalStock >= requested
        });
    }
    return stockValidation;
};

// Helper to group sales data by date
const groupSalesByDate = (salesData) => {
    return salesData.reduce((acc, item) => {
        // Group by receipt_number if available, otherwise by date
        // If receipt number exists, use date + receipt number as the key
        // This allows items with the same receipt number to be grouped together
        const key = item.receipt_number ? 
            `${item.sales_date.toISOString()}_${item.receipt_number}` : 
            item.sales_date;
            
        if (!acc[key]) {
            acc[key] = {
                items: [],
                sales_date: item.sales_date,
                receipt_number: item.receipt_number || null
            };
        }
        acc[key].items.push(item);
        return acc;
    }, {});
};

// Helper to process a single sale item - OPTIMIZED VERSION
const processSaleItem = async (item, sale_id, user_id, t) => {
    let remainingQuantity = parseInt(item.quantity);

    // Get batches in FIFO order - but limit to only what we need
    const availableBatches = await BatchStock.findAll({
        where: {
            code_product: item.code_product,
            stock_quantity: {
                [Op.gt]: 0
            }
        },
        order: [
            ['exp_date', 'ASC'],
            ['arrival_date', 'ASC']
        ],
        limit: 5, // Limit to first 5 batches to reduce query size
        transaction: t,
        lock: t.LOCK.UPDATE
    });

    const salesDetailsToCreate = [];
    const batchUpdates = [];

    // Process each batch until quantity is fulfilled
    for (const batch of availableBatches) {
        if (remainingQuantity <= 0) break;

        const batchStock = parseInt(batch.stock_quantity);
        const quantityToDeduct = Math.min(remainingQuantity, batchStock);

        if (quantityToDeduct > 0) {
            // Prepare sales detail for bulk creation
            salesDetailsToCreate.push({
                sales_id: sale_id,
                code_product: item.code_product,
                batch_id: batch.batch_id,
                quantity: quantityToDeduct,
                selling_price: item.selling_price,
                subtotal: quantityToDeduct * item.selling_price,
                created_by: user_id,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Prepare batch update
            batchUpdates.push({
                batch_id: batch.batch_id,
                newStock: batchStock - quantityToDeduct
            });

            remainingQuantity -= quantityToDeduct;
        }
    }

    // Bulk create sales details
    if (salesDetailsToCreate.length > 0) {
        await SalesDetail.bulkCreate(salesDetailsToCreate, { transaction: t });
    }

    // Bulk update batch stocks
    for (const update of batchUpdates) {
        await BatchStock.update(
            { 
                stock_quantity: update.newStock,
                updated_at: new Date()
            },
            { 
                where: { batch_id: update.batch_id },
                transaction: t 
            }
        );
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
    
    // Make sure we preserve the exact date and time from the input
    let salesDate;
    if (saleData.sales_date instanceof Date) {
        // If it's already a Date object, use it directly
        salesDate = saleData.sales_date;
    } else if (saleData.sales_date) {
        // If it's a string or timestamp, parse it properly and preserve time
        salesDate = new Date(saleData.sales_date);
    } else {
        // If no date provided, use current date and time
        salesDate = new Date();
    }
    
    // Log the date being saved for debugging
    console.log('Saving sale with date:', salesDate.toISOString());

    const sale = await Sales.create({
        user_id,
        sales_date: salesDate,
        total_amount: normalizedItems.reduce((sum, item) => sum + (parseFloat(item.selling_price) * parseInt(item.quantity)), 0),
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

// Helper untuk normalisasi items dengan fallback ke name_product (optimized for batch processing)
const normalizeItemsWithFallback = async (items, t) => {
    const normalized = [];
    const skippedItems = [];
    
    // Use global cache if available, otherwise fallback to database
    const useGlobalCache = global.productLookup && global.batchLookup;
    
    if (useGlobalCache) {
        // Use pre-loaded cache for faster processing
        for (const item of items) {
            let code_product = normalizeProductCode(item.code_product);
            let product = null;
            
            // Try to find by code first
            if (code_product) {
                product = global.productLookup.get(code_product);
            }
            
            // Fallback to name if not found by code
            if (!product && item.name_product) {
                product = global.productLookup.get(item.name_product);
                if (product) {
                    code_product = product.code_product;
                }
            }
            
            // Check if product exists
            if (!product) {
                throw new Error(`Product not found: ${item.name_product || item.code_product}`);
            }
            
            // Skip status check since we already loaded only active products from cache
            // All products in global cache are guaranteed to be active
            
            // Get available batch stocks from cache
            const availableBatches = global.batchLookup.get(code_product) || [];
            const validBatches = availableBatches.filter(batch => batch.stock_quantity > 0); // Fix: use stock_quantity
            
            if (validBatches.length === 0) {
                throw new Error(`No available stock for product: ${product.name_product}`);
            }
            
            // Use the earliest expiring batch
            const batch = validBatches.sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date))[0];
            
            normalized.push({
                code_product,
                name_product: product.name_product,
                batch_code: batch.batch_code,
                quantity: parseInt(item.quantity) || 1,
                selling_price: parseFloat(item.selling_price) || product.sell_price || 0 // Fix: use sell_price
            });
        }
    } else {
        // Fallback to original database-based method
        // Collect all unique product codes and names for batch loading
        const productCodes = [...new Set(items.map(item => normalizeProductCode(item.code_product)).filter(Boolean))];
        const productNames = [...new Set(items.map(item => item.name_product).filter(Boolean))];
        
        // Batch load all products to reduce database queries
        const productsByCode = new Map();
        const productsByName = new Map();
        
        if (productCodes.length > 0) {
            const products = await Product.findAll({ 
                where: { code_product: productCodes },
                attributes: ['code_product', 'name_product', 'status', 'sell_price'], // Fix: add sell_price
                transaction: t,
                logging: false
            });
            products.forEach(p => productsByCode.set(p.code_product, p));
        }
        
        if (productNames.length > 0) {
            const products = await Product.findAll({ 
                where: { name_product: productNames },
                attributes: ['code_product', 'name_product', 'status', 'sell_price'], // Fix: add sell_price
                transaction: t,
                logging: false
            });
            products.forEach(p => productsByName.set(p.name_product, p));
        }
        
        // Process items using cached products
        for (const item of items) {
            let code_product = normalizeProductCode(item.code_product);
            let product = null;
            
            // Try to find by code first
            if (code_product) {
                product = productsByCode.get(code_product);
            }
            
            // Fallback to name if not found by code
            if (!product && item.name_product) {
                product = productsByName.get(item.name_product);
                if (product) {
                    code_product = product.code_product;
                }
            }
            
            // Check if product exists
            if (!product) {
                throw new Error(`Product not found: ${item.name_product || item.code_product}`);
            }
            
            // Skip inactive products instead of throwing error
            if (product.status === 'inactive') {
                skippedItems.push({
                    code_product: product.code_product,
                    name_product: product.name_product,
                    reason: 'Product is inactive'
                });
                continue; // Skip this item and continue with next
            }
            
            // Get the first available batch for this product
            const availableBatch = await BatchStock.findOne({
                where: { 
                    code_product,
                    stock_quantity: { [Op.gt]: 0 } // Fix: use stock_quantity
                },
                order: [['exp_date', 'ASC']],
                transaction: t,
                logging: false
            });
            
            if (!availableBatch) {
                throw new Error(`No available stock for product: ${product.name_product}`);
            }
            
            normalized.push({
                code_product,
                name_product: product.name_product,
                batch_code: availableBatch.batch_code,
                quantity: parseInt(item.quantity) || 1,
                selling_price: parseFloat(item.selling_price) || product.sell_price || 0 // Fix: use sell_price
            });
        }
    }
    
    return { normalized, skippedItems };
};

// Helper to check for duplicate sales with improved performance
const checkDuplicateSale = async (items, sales_date, user_id, t) => {
    // Create a hash of the items to quickly check for duplicates
    // Sort items by code_product to ensure consistent hashing
    const sortedItems = [...items].sort((a, b) => 
        a.code_product.localeCompare(b.code_product)
    );
    
    // Create a hash string representing this sale
    const itemsHash = sortedItems.map(item => 
        `${item.code_product}:${parseFloat(item.selling_price).toFixed(2)}:${parseInt(item.quantity)}`
    ).join('|');
    
    const startOfDay = new Date(sales_date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sales_date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all sales for this user on this date
    const existingSales = await Sales.findAll({
        where: {
            user_id,
            sales_date: {
                [Op.between]: [startOfDay, endOfDay]
            }
        },
        include: [{
            model: SalesDetail,
            attributes: ['code_product', 'quantity', 'selling_price'],
            required: true
        }],
        transaction: t
    });

    // Check each existing sale's items against current items
    for (const sale of existingSales) {
        if (!sale.SalesDetails || !Array.isArray(sale.SalesDetails) || sale.SalesDetails.length !== items.length) {
            continue; // Skip if no details or different number of items
        }

        // Sort details by code_product for consistent comparison
        const sortedDetails = [...sale.SalesDetails].sort((a, b) => 
            a.code_product.localeCompare(b.code_product)
        );
        
        // Create a hash for the existing sale
        const existingHash = sortedDetails.map(detail => 
            `${detail.code_product}:${parseFloat(detail.selling_price).toFixed(2)}:${parseInt(detail.quantity)}`
        ).join('|');
        
        // Direct hash comparison is much faster than nested loops
        if (existingHash === itemsHash) {
            return true; // Found a duplicate sale
        }
    }
    return false;
};

export const importSalesFromCSV = async (req, res) => {
    const BATCH_SIZE = 100; // Reduce batch size for better performance and less memory usage
    const MAX_CONCURRENT_BATCHES = 1; // Process one batch at a time to prevent lock contention
    
    let mainTransaction;
    
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "File tidak ditemukan" });
        }

        const user_id = req.user?.user_id;
        if (!user_id) {
            return res.status(401).json({ msg: "User ID is required" });
        }

        let processedCount = 0;
        let successCount = 0;
        const errors = [];
        const salesData = [];
        const uniqueDataSet = new Set();
        const startTime = Date.now();
        
        console.log(`Starting CSV import for user ${user_id} at ${new Date().toISOString()}`);
        
        // Pre-load data for better performance - OPTIMIZED LOADING
        console.log('Pre-loading product and batch stock data...');
        const [allProducts, allBatchStocks] = await Promise.all([
            Product.findAll({
                where: { status: 'active' },
                attributes: ['code_product', 'name_product', 'sell_price', 'status'],
                raw: true,
                logging: false
            }),
            BatchStock.findAll({
                where: { stock_quantity: { [Op.gt]: 0 } },
                attributes: ['batch_code', 'code_product', 'stock_quantity', 'exp_date', 'batch_id'],
                raw: true,
                logging: false
            })
        ]);
        
        // Create lookup maps
        global.productLookup = new Map();
        global.batchLookup = new Map();
        
        allProducts.forEach(p => {
            global.productLookup.set(p.code_product, p);
            global.productLookup.set(p.name_product, p);
        });
        
        allBatchStocks.forEach(b => {
            if (!global.batchLookup.has(b.code_product)) {
                global.batchLookup.set(b.code_product, []);
            }
            global.batchLookup.get(b.code_product).push(b);
        });
        
        console.log(`Loaded ${allProducts.length} products and ${allBatchStocks.length} batches`);

        // Read CSV file with streaming and batching - OPTIMIZED
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path, { 
                highWaterMark: 64 * 1024 // Reduce buffer to 64KB for better memory usage
            })
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
                skip_empty_lines: true,
                max_limit_on_data_read: 100000 // Reduce row size limit
            }))
            .on("data", (row) => {
                processedCount++;
                
                // Progress logging for large files - reduce frequency
                if (processedCount % 2000 === 0) {
                    console.log(`Processed ${processedCount} rows...`);
                }
                
                try {
                    // Extract data from row with fallbacks for different column names
                    const dateInput = row['Tanggal'] || row['Date'] || row['sales_date'];
                    let sales_date;
                    
                    // Enhanced date parsing with multiple format support
                    if (dateInput) {
                        // Try different date formats
                        sales_date = parseDateFlexible(dateInput);
                        if (!sales_date || isNaN(sales_date.getTime())) {
                            errors.push({ row: processedCount, error: `Invalid date format: ${dateInput}` });
                            return;
                        }
                    } else {
                        errors.push({ row: processedCount, error: 'Date field is required' });
                        return;
                    }
                    
                    const code_product = normalizeProductCode(row['Kode Bara'] || row['Kode Barang'] || row['code_product']);
                    const name_product = row['Nama Bar'] || row['Nama Barang'] || row['name_product'] || null;
                    const quantity = parseInt(row['Qty'] || row['Jumlah Barang'] || row['quantity']);
                    const selling_price = parseFloat((row['Harga Jual'] || row['selling_price'] || '').toString().replace(/,/g, '.'));
                    const subtotal = parseInt(row['Jumlah'] || row['subtotal'] || (quantity * selling_price));

                    // Basic validation
                    if (!name_product && !code_product) {
                        errors.push({ row: processedCount, error: 'Product code or name is required' });
                        return;
                    }
                    if (isNaN(quantity) || quantity <= 0) {
                        errors.push({ row: processedCount, error: 'Invalid quantity' });
                        return;
                    }
                    if (isNaN(selling_price) || selling_price <= 0) {
                        errors.push({ row: processedCount, error: 'Invalid selling price' });
                        return;
                    }
                    if (isNaN(subtotal) || subtotal <= 0) {
                        errors.push({ row: processedCount, error: 'Invalid subtotal' });
                        return;
                    }
                    // Date validation already done above, no need to re-validate
                    
                    // Check if receipt number is provided but empty
                    const receiptNumber = row['NO.Nota'] || null;
                    if (receiptNumber !== null && receiptNumber.trim() === '') {
                        errors.push({ row: processedCount, error: 'Receipt number (NO.Nota) cannot be empty if provided' });
                        return;
                    }

                    // Calculate quantity based on subtotal if needed
                    let final_quantity = quantity;
                    if (quantity * selling_price !== subtotal && subtotal % selling_price === 0) {
                        final_quantity = subtotal / selling_price;
                    }
                    
                    
                    // Create a unique key for this row to detect duplicates within the CSV
                    // If NO.Nota exists, use it as the primary identifier
                    const rowKey = receiptNumber ? 
                      `nota:${receiptNumber}_product:${code_product}` : 
                      `${sales_date.toISOString()}_${code_product}_${final_quantity}_${selling_price}`;
                    
                    // Check for duplicates within the CSV
                    if (uniqueDataSet.has(rowKey)) {
                        // Skip duplicates silently - we already have this exact entry
                        return;
                    }
                    
                    // Add to unique set
                    uniqueDataSet.add(rowKey);
                    
                    // Add to salesData for processing
                    salesData.push({
                        sales_date,
                        code_product,
                        name_product,
                        quantity: final_quantity,
                        selling_price,
                        subtotal,
                        receipt_number: row['NO.Nota'] || null, // Store the receipt number
                        cashier_name: row['Kasir'] || null,     // Store the cashier name
                        unit: row['Satuan'] || null,           // Store the unit information
                        barcode: row['Barcode'] || null        // Store the barcode for reference
                    });
                } catch (error) {
                    errors.push({ row: processedCount, error: `Error processing row: ${error.message}` });
                }
            })
            .on("error", (error) => reject(error))
            .on("end", () => resolve());
        });

        // Delete uploaded file right away to free up disk space
        fs.unlinkSync(req.file.path);

        if (salesData.length === 0) {
            return res.status(400).json({
                msg: "No valid data found in CSV",
                errors
            });
        }

        console.log(`CSV parsing completed. Processing ${salesData.length} valid rows in batches...`);

        // Process data in batches to handle large datasets
        const results = await processSalesInBatches(salesData, user_id, BATCH_SIZE, MAX_CONCURRENT_BATCHES);
        
        successCount = results.successCount;
        const allSkippedItems = results.skippedItems;
        
        // Add any processing errors to the errors array
        if (results.errors && results.errors.length > 0) {
            errors.push(...results.errors);
        }

        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`Import completed in ${elapsed.toFixed(2)} seconds`);
        console.log(`Performance: ${(successCount / elapsed).toFixed(1)} sales/second`);
        
        return res.json({
            msg: `Import completed: ${successCount} sales created from ${processedCount} rows`,
            success_count: successCount,
            total_rows: processedCount,
            error_count: errors.length,
            skipped_inactive_count: allSkippedItems ? allSkippedItems.length : 0,
            skipped_inactive_items: allSkippedItems && allSkippedItems.length > 0 ? allSkippedItems : null,
            elapsed_time: `${elapsed.toFixed(2)} seconds`,
            performance: `${(successCount / elapsed).toFixed(1)} sales/second`,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        console.error('Import error:', error);
        return res.status(500).json({
            msg: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// New function to process sales in batches
const processSalesInBatches = async (salesData, user_id, batchSize, maxConcurrentBatches) => {
    const allSkippedItems = [];
    let successCount = 0;
    const errors = [];

    // Group sales by date first
    const salesByDate = groupSalesByDate(salesData);
    const salesEntries = Object.entries(salesByDate);
    
    // Process in batches
    const totalBatches = Math.ceil(salesEntries.length / batchSize);
    console.log(`Processing ${salesEntries.length} sale groups in ${totalBatches} batches`);

    for (let i = 0; i < salesEntries.length; i += batchSize) {
        const batch = salesEntries.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} sale groups)`);
        
        // Create a new transaction for each batch
        const batchTransaction = await db.transaction();
        
        try {
            const batchResults = [];
            
            // Process current batch
            for (const [key, saleData] of batch) {
                try {
                    // Normalize items and check for inactive products
                    const { normalized: normalizedItems, skippedItems } = await normalizeItemsWithFallback(saleData.items, batchTransaction);
                    
                    if (skippedItems && skippedItems.length > 0) {
                        allSkippedItems.push(...skippedItems);
                    }
                    
                    // Skip if no valid items after filtering inactive products
                    if (normalizedItems.length === 0) {
                        continue;
                    }
                    
                    // Validate stock availability
                    const stockValidation = await validateStockAvailability(normalizedItems, batchTransaction);
                    const sufficientItems = normalizedItems.filter(item => {
                        const found = stockValidation.find(v => (v.code_product === item.code_product || v.name_product === item.name_product));
                        return found && found.sufficient;
                    });
                    
                    // Skip if no sufficient stock
                    if (sufficientItems.length === 0) {
                        continue;
                    }
                    
                    // Create the sale
                    const sale = await createSingleSale(
                        { 
                            sales_date: saleData.sales_date,
                            receipt_number: saleData.receipt_number
                        },
                        user_id,
                        sufficientItems,
                        batchTransaction
                    );
                    
                    batchResults.push({
                        ...sale, 
                        receipt_number: saleData.receipt_number
                    });
                    
                } catch (error) {
                    console.error(`Error processing sale in batch ${batchNumber}:`, error);
                    errors.push({
                        batch: batchNumber,
                        key,
                        error: `Error processing sale: ${error.message}`
                    });
                }
            }
            
            // Commit batch transaction
            await batchTransaction.commit();
            successCount += batchResults.length;
            
            console.log(`Batch ${batchNumber} completed: ${batchResults.length} sales created`);
            
        } catch (error) {
            // Rollback batch transaction on error
            await batchTransaction.rollback();
            console.error(`Batch ${batchNumber} failed:`, error);
            errors.push({
                batch: batchNumber,
                error: `Batch processing failed: ${error.message}`
            });
        }
        
        // Add a small delay between batches to prevent overwhelming the database
        if (i + batchSize < salesEntries.length) {
            await new Promise(resolve => setTimeout(resolve, 10)); // Reduce delay from 50ms to 10ms
        }
    }

    return {
        successCount,
        skippedItems: allSkippedItems,
        errors
    };
};

// Helper function for bulk stock updates
const updateStockInBulk = async (salesDetailsData, transaction) => {
    try {
        // Group by batch_code to aggregate quantities
        const stockUpdates = {};
        
        salesDetailsData.forEach(detail => {
            if (stockUpdates[detail.batch_code]) {
                stockUpdates[detail.batch_code] += detail.quantity;
            } else {
                stockUpdates[detail.batch_code] = detail.quantity;
            }
        });
        
        // Execute bulk stock updates
        const updatePromises = Object.entries(stockUpdates).map(([batch_code, totalQuantity]) => {
            return db.query(
                'UPDATE batch_stock SET stock_quantity = stock_quantity - ? WHERE batch_code = ?', // Fix: use batch_stock table and stock_quantity column
                {
                    replacements: [totalQuantity, batch_code],
                    type: db.QueryTypes.UPDATE,
                    transaction
                }
            );
        });
        
        await Promise.all(updatePromises);
        
    } catch (error) {
        console.error('Error in bulk stock update:', error);
        throw error;
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

        // Check for duplicate sales
        const isDuplicate = await checkDuplicateSale(items, sales_date, user_id, t);
        if (isDuplicate) {
            await t.rollback();
            return res.status(400).json({ msg: "Duplicate sale detected. This exact sale appears to already exist." });
        }

        // Normalize items with fallback
        const { normalized: normalizedItems, skippedItems } = await normalizeItemsWithFallback(items, t);
        
        // If all items were skipped due to inactive status, return error
        if (normalizedItems.length === 0 && skippedItems.length > 0) {
            await t.rollback();
            return res.status(400).json({ 
                msg: "No valid items to process. All products are inactive.",
                skippedItems 
            });
        }

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
        // Extract filter parameters from query string
        const { 
            start_date, 
            end_date, 
            code_product,
            min_total,
            max_total,
            sort_by = 'sales_date',
            sort_dir = 'DESC'
        } = req.query;
        
        // console.log('=== getSales Request ===');
        // console.log('Query params received:', req.query);
        // console.log('Sort params:', { sort_by, sort_dir });
        
        // Build where clause based on filters
        let whereClause = {};
        let includeWhere = {};
        
        // Date range filter
        if (start_date || end_date) {
            whereClause.sales_date = {};
            
            if (start_date) {
                const startDateTime = new Date(start_date);
                startDateTime.setHours(0, 0, 0, 0);
                whereClause.sales_date[Op.gte] = startDateTime;
            }
            
            if (end_date) {
                const endDateTime = new Date(end_date);
                endDateTime.setHours(23, 59, 59, 999);
                whereClause.sales_date[Op.lte] = endDateTime;
            }
        }
        
        // Total amount range filter
        if (min_total) {
            whereClause.total_amount = whereClause.total_amount || {};
            whereClause.total_amount[Op.gte] = parseFloat(min_total);
        }
        
        if (max_total) {
            whereClause.total_amount = whereClause.total_amount || {};
            whereClause.total_amount[Op.lte] = parseFloat(max_total);
        }
        
        // Product code filter - requires joining SalesDetail
        if (code_product) {
            includeWhere.code_product = code_product;
        }
        
        // Set up the include options for the query
        const includeOptions = [
            {
                model: User,
                attributes: ['user_id', 'name', 'email', 'role']
            },
            {
                model: SalesDetail,
                include: [{
                    model: Product,
                    attributes: ['name_product']
                }, {
                    model: BatchStock,
                    attributes: ['batch_code', 'exp_date']
                }],
                // Apply product filtering if specified
                ...(Object.keys(includeWhere).length > 0 ? { where: includeWhere } : {})
            }
        ];
        
        // Determine sorting
        let orderBy = []; 
        // console.log('Determining sort order...');
        // console.log('Sort parameters received:', { sort_by, sort_dir });
        
        switch(sort_by) {
            case 'total_amount':
                orderBy.push(['total_amount', sort_dir]);
                // console.log('Applied total_amount sort:', orderBy);
                break;
            case 'user_name':
                orderBy.push([{ model: User, as: 'User' }, 'name', sort_dir]);
                // console.log('Applied user_name sort:', orderBy);
                break;
            case 'sales_date':
            default:
                orderBy.push(['sales_date', sort_dir]);
                // console.log('Applied sales_date sort (default):', orderBy);
                break;
        }
        
        // console.log('Final orderBy clause:', JSON.stringify(orderBy, null, 2));
        
        const queryOptions = {
            where: whereClause,
            include: includeOptions,
            order: orderBy,
            // Add distinct to handle cases where the same sale appears multiple times due to joins
            distinct: true,
            // Remove limit to show all data
            // Add specific attributes to reduce data transfer
            attributes: [
                'sales_id', 
                'sales_date', 
                'total_amount', 
                'user_id',
                'created_at'
            ],
            // Add logging to see the actual SQL query
            // logging: (sql) => {
            //     console.log('=== SQL QUERY ===');
            //     console.log(sql);
            //     console.log('==================');
            // }
        };
        
        // console.log('Query options:', JSON.stringify({
        //     where: queryOptions.where,
        //     order: queryOptions.order,
        //     attributes: queryOptions.attributes
        // }, null, 2));

        const response = await Sales.findAll(queryOptions);
        
        // console.log(`Found ${response.length} sales with sort ${sort_by} ${sort_dir}`);
        
        // Log first few items to debug sorting
        if (response.length > 0) {
            // console.log('First 5 items after sorting:');
            // response.slice(0, 5).forEach((sale, index) => {
            //     console.log(`${index + 1}. ID: ${sale.sales_id}, Date: ${sale.sales_date}, Total: ${sale.total_amount}, User: ${sale.User?.name || 'N/A'}`);
            // });
        }
        
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const sale = await Sales.findOne({
            where: { sales_id: req.params.id },
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['user_id', 'name', 'email', 'role']
                },
                {
                    model: SalesDetail,
                    include: [{
                        model: Product,
                        attributes: ['code_product', 'name_product']
                    }, {
                        model: BatchStock,
                        attributes: ['batch_code', 'exp_date']
                    }]
                }
            ]
        });
        
        if (!sale) {
            return res.status(404).json({ msg: "Sale not found" });
        }
        
        res.status(200).json(sale);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};