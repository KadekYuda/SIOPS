import { Op, Sequelize } from "sequelize";
import fs from "fs";
import path from "path";
import multer from "multer";
import { parse } from "csv-parse";
import Product from "../models/ProductModel.js";
import Categories from "../models/CategoriesModel.js";
import BatchStock from "../models/BatchstockModel.js";



// set up multer for file upload

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




export const importProductsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }

    const errors = [];
    let csvColumns = [];
    let processedCount = 0;
    let successCount = 0;
    const BATCH_SIZE = 100; // Increased batch size for better performance
    const startTime = Date.now();

    console.log('Memulai proses impor...');

    // Siapkan cache untuk kategori
    const categoryCache = new Map();
    
    // Kumpulkan semua data dari CSV terlebih dahulu
    const allRows = [];
    
    // Baca file CSV dan simpan semua data
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(parse({
          delimiter: ",",
          columns: (header) => {
            csvColumns = header.map(h => h.trim());
            console.log('Kolom CSV terdeteksi:', csvColumns);
            
            if (!csvColumns.includes('KdBar')) {
              console.error('Kolom KdBar tidak ditemukan di CSV');
              reject(new Error('Format CSV tidak valid: Kolom KdBar tidak ditemukan'));
              return false;
            }
            return csvColumns;
          },
          trim: true,
          relax_column_count: true,
          skip_empty_lines: true
        }))
        .on("data", (row) => {
          allRows.push(row); // Simpan semua baris untuk diproses nanti
        })
        .on("error", (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        })
        .on("end", () => {
          console.log(`File CSV dibaca: ${allRows.length} baris`);
          resolve();
        });
    });
    
    // Hapus file setelah dibaca
    if (req.file) fs.unlinkSync(req.file.path);
    
    // Proses semua kategori terlebih dahulu
    const uniqueCategories = new Set();
    
    // Transformasi data
    const transformedRows = [];
    // Store row indices with errors - removing the unused collection warning
    const validationErrors = new Set(); 
    
    // Improved cleanCodeField function to handle leading apostrophes
    const cleanCodeField = (value, fieldName) => {
      if (value === null || value === undefined) return null;
      let strVal = String(value).trim();
      
      // Remove leading apostrophe if present
      if (strVal.startsWith("'")) {
        strVal = strVal.substring(1);
      }

      // Handle scientific notation
      if (/^\d+(\.\d+)?[eE]\+?\d+$/.test(strVal)) {
        try {
          return BigInt(Number(strVal)).toString();
        } catch {
          // Cara manual jika BigInt gagal
          const parts = strVal.toLowerCase().split('e');
          const base = parseFloat(parts[0]);
          const exponent = parseInt(parts[1].replace('+', ''));
          const baseStr = base.toString().replace('.', '');
          const zeros = exponent - (baseStr.length - base.toString().indexOf('.') + 1);
          return baseStr + '0'.repeat(Math.max(0, zeros));
        }
      }

      return strVal;
    };
    
    for (const row of allRows) {
      processedCount++;
      
      try {
        const codeProduct = cleanCodeField(row.KdBar, 'code_product');
        
        const transformedRow = {
          code_product: codeProduct,
          barcode: cleanCodeField(row.Barcode, 'barcode'),
          name_product: row.Nmbar?.trim() || null,
          code_categories: row.KdKel?.trim() || null,
          name_categories: row.NmKel?.trim() || null,
          sell_price: parseFloat((row.HJual || '0').toString().replace(',', '.')) || 0.0,
          min_stock: Math.floor(Math.random() * 10) + 1,
          purchase_price: parseFloat((row.HBeli || '0').toString().replace(',', '.')) || 0.0,
          initial_stock: parseInt(row.StAwal || '0') || 0,
          stock_quantity: parseInt(row.StMasuk || '0') || 0,
        };

        // Validasi field wajib
        if (!transformedRow.code_product) {
          errors.push({
            row: processedCount,
            code_product: row.KdBar,
            error: `Baris ${processedCount}: Kode produk wajib diisi`
          });
          validationErrors.add(processedCount); // Using validationErrors instead of errorRows
          continue; // Skip this row
        }

        transformedRows.push(transformedRow);
        
        // Kumpulkan kategori unik
        if (transformedRow.code_categories) {
          uniqueCategories.add(transformedRow.code_categories);
        }
      } catch (error) {
        console.error(`Error transformasi data baris ${processedCount}:`, error);
        errors.push({ 
          row: processedCount,
          code_product: row.KdBar,
          error: `Error transformasi baris ${processedCount}: ${error.message}` 
        });
        validationErrors.add(processedCount); // Using validationErrors instead of errorRows
      }
    }
    
    // Actually using the Set we created to provide statistics
    console.log(`Total baris dengan error validasi: ${validationErrors.size}`);
    
    // Proses semua kategori sekaligus (single DB operation)
    console.log(`Memproses ${uniqueCategories.size} kategori unik...`);
    try {
      // Cari kategori yang sudah ada
      const existingCategories = await Categories.findAll({
        where: {
          code_categories: {
            [Op.in]: Array.from(uniqueCategories)
          }
        }
      });
      
      // Tambahkan ke cache
      existingCategories.forEach(category => {
        categoryCache.set(category.code_categories, category);
      });
      
      // Buat kategori yang belum ada
      const categoriesToCreate = [];
      const now = new Date();
      
      for (const catCode of uniqueCategories) {
        if (!categoryCache.has(catCode)) {
          const catRow = transformedRows.find(row => row.code_categories === catCode);
          if (catRow) {
            categoriesToCreate.push({
              code_categories: catCode,
              name_categories: catRow.name_categories,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }
      
      if (categoriesToCreate.length > 0) {
        console.log(`Membuat ${categoriesToCreate.length} kategori baru...`);
        const createdCategories = await Categories.bulkCreate(categoriesToCreate);
        createdCategories.forEach(category => {
          categoryCache.set(category.code_categories, category);
        });
      }
    } catch (error) {
      console.error('Error saat memproses kategori:', error);
      errors.push({
        error: `Error saat memproses kategori: ${error.message}`
      });
      // Lanjutkan meski ada error kategori
    }
    
    // Buat lookup produk yang sudah ada (single DB operation)
    const allProductCodes = transformedRows.map(row => row.code_product);
    const existingProductMap = new Map();
    
    try {
      const existingProducts = await Product.findAll({
        where: {
          code_product: {
            [Op.in]: allProductCodes
          }
        }
      });
      
      existingProducts.forEach(product => {
        existingProductMap.set(product.code_product, product);
      });
      
      console.log(`Ditemukan ${existingProducts.length} produk yang sudah ada`);
    } catch (error) {
      console.error('Error saat mencari produk yang sudah ada:', error);
      errors.push({
        error: `Error saat mencari produk yang sudah ada: ${error.message}`
      });
      // Lanjutkan meski ada error
    }
    
    // Dapatkan hitungan batch untuk semua produk sekaligus
    const batchCountMap = new Map();
    
    try {
      // Dapatkan hitungan batch untuk semua produk sekaligus
      const batches = await BatchStock.findAll({
        attributes: ['code_product', 'batch_code'],
        where: {
          code_product: {
            [Op.in]: allProductCodes
          }
        }
      });
      
      // Hitung jumlah batch untuk setiap produk
      batches.forEach(batch => {
        const count = batchCountMap.get(batch.code_product) || 0;
        batchCountMap.set(batch.code_product, count + 1);
      });
      
      console.log(`Mendapatkan informasi batch untuk ${batchCountMap.size} produk`);
    } catch (error) {
      console.error('Error saat mendapatkan data batch:', error);
      errors.push({
        error: `Error saat mendapatkan data batch: ${error.message}`
      });
      // Lanjutkan meski ada error
    }
    
    // Proses data dalam batch yang lebih kecil
    const now = new Date();
    
    // Track products that were successfully created
    const successfulProducts = new Map(); // Changed to Map to store both product and its creation status
    
    // First pass: Create or update all products
    console.log(`Memproses ${transformedRows.length} produk...`);
    
    // Optimize by doing bulk operations where possible
    const productsToCreate = [];
    
    for (const row of transformedRows) {
      // Siapkan objek produk dasar
      const productData = {
        ...row,
        code_categories: row.code_categories || null,
        created_at: now,
        updated_at: now,
      };
      
      // Cek apakah produk sudah ada
      if (!existingProductMap.has(row.code_product)) {
        productsToCreate.push(productData);
      } else {
        // Mark as successful for existing products
        successfulProducts.set(row.code_product, { 
          isNew: false, 
          data: row 
        });
      }
    }
    
    // Create all new products in one bulk operation if possible
    if (productsToCreate.length > 0) {
      try {
        console.log(`Mencoba membuat ${productsToCreate.length} produk baru dalam bulk operation`);
        const createdProducts = await Product.bulkCreate(productsToCreate);
        
        // Mark successfully created products
        createdProducts.forEach(product => {
          const rowData = transformedRows.find(r => r.code_product === product.code_product);
          successfulProducts.set(product.code_product, {
            isNew: true,
            data: rowData
          });
        });
        
        console.log(`Berhasil membuat ${createdProducts.length} produk baru`);
      } catch (bulkError) {
        console.error(`Bulk create failed, falling back to individual creates:`, bulkError);
        
        // Try creating products individually
        for (const product of productsToCreate) {
          try {
            await Product.create(product);
            const rowData = transformedRows.find(r => r.code_product === product.code_product);
            successfulProducts.set(product.code_product, {
              isNew: true,
              data: rowData
            });
          } catch (individualError) {
            console.error(`Error creating product ${product.code_product}:`, individualError);
            errors.push({
              code_product: product.code_product,
              error: `Error creating product: ${individualError.message}`
            });
          }
        }
      }
    }
    
    // Update existing products in batches
    const productsToUpdate = transformedRows.filter(row => 
      existingProductMap.has(row.code_product) && 
      !successfulProducts.has(row.code_product)
    );
    
    if (productsToUpdate.length > 0) {
      console.log(`Memperbarui ${productsToUpdate.length} produk yang sudah ada`);
      
      for (let i = 0; i < productsToUpdate.length; i += BATCH_SIZE) {
        const batch = productsToUpdate.slice(i, i + BATCH_SIZE);
        
        // Process updates in parallel for better performance
        await Promise.all(batch.map(async (product) => {
          try {
            await Product.update(
              { 
                barcode: product.barcode,
                name_product: product.name_product,
                code_categories: product.code_categories,
                sell_price: product.sell_price,
                min_stock: product.min_stock,
                updated_at: now
              },
              { where: { code_product: product.code_product } }
            );
            
            successfulProducts.set(product.code_product, {
              isNew: false,
              data: product
            });
          } catch (updateError) {
            console.error(`Error updating product ${product.code_product}:`, updateError);
            errors.push({
              code_product: product.code_product,
              error: `Error updating product: ${updateError.message}`
            });
          }
        }));
        
        console.log(`Updated batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(productsToUpdate.length/BATCH_SIZE)}`);
      }
    }
    
    // Helper functions for date generation
    const getRandomArrivalDate = () => {
      const now = new Date();
      // Random date between 1 year ago and today
      const startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1); // 1 year ago
      
      // Get random timestamp between start date and now
      const randomTimestamp = startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime());
      return new Date(randomTimestamp);
    };

    const getRandomExpDate = (arrivalDate) => {
      const expDate = new Date(arrivalDate);
      // Random between 3-12 months after arrival
      const randomMonths = Math.floor(Math.random() * 10) + 3;
      expDate.setMonth(expDate.getMonth() + randomMonths);
      return expDate;
    };
    
    // Second pass: Create batch stocks for successfully created/updated products
    console.log(`Creating batch stocks for ${successfulProducts.size} products`);
    
    const batchStocksToCreate = [];
    
    // Prepare all batch stocks
    for (const [code_product, productInfo] of successfulProducts.entries()) {
      try {
        const row = productInfo.data;
        
        // // Skip if no stock to add
        // if (row.initial_stock <= 0 && row.stock_quantity <= 0) {
        //   continue;
        // }
        
        // Siapkan batch code
        const batchCount = batchCountMap.get(code_product) || 0;
        const newBatchNumber = String(batchCount + 1).padStart(3, '0');
        const productNameSlug = (row.name_product || code_product)
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9\-]/g, "")
          .substring(0, 30); // Limit length to avoid excessively long batch codes
        
        const batch_code = `${productNameSlug}-${newBatchNumber}`;
        
        // Generate random arrival and expiration dates
        const arrivalDate = getRandomArrivalDate();
        const expDate = getRandomExpDate(arrivalDate);
        
        // Siapkan data batch stock with randomized dates
        batchStocksToCreate.push({
          code_product,
          batch_code,
          purchase_price: row.purchase_price,
          initial_stock: row.initial_stock,
          stock_quantity: row.stock_quantity,
          arrival_date: arrivalDate,
          exp_date: expDate,
          created_at: now,
          updated_at: now,
        });
      } catch (error) {
        console.error(`Error preparing batch stock for ${code_product}:`, error);
        errors.push({
          code_product,
          error: `Error preparing batch stock: ${error.message}`
        });
      }
    }
    
    // Create batch stocks in larger chunks
    const BATCH_STOCK_CHUNK_SIZE = 100; // Increased for better performance
    
    if (batchStocksToCreate.length > 0) {
      console.log(`Creating ${batchStocksToCreate.length} batch stocks in chunks of ${BATCH_STOCK_CHUNK_SIZE}`);
      
      let batchStockSuccessCount = 0;
      
      for (let i = 0; i < batchStocksToCreate.length; i += BATCH_STOCK_CHUNK_SIZE) {
        const batchStockChunk = batchStocksToCreate.slice(i, i + BATCH_STOCK_CHUNK_SIZE);
        
        try {
          const createdBatchStocks = await BatchStock.bulkCreate(batchStockChunk);
          batchStockSuccessCount += createdBatchStocks.length;
          
          console.log(`Created chunk ${Math.floor(i/BATCH_STOCK_CHUNK_SIZE) + 1}/${Math.ceil(batchStocksToCreate.length/BATCH_STOCK_CHUNK_SIZE)}: ${createdBatchStocks.length} batch stocks`);
        } catch (chunkError) {
          console.error(`Bulk batch stock creation failed, trying individually:`, chunkError);
          
          // Try individually if bulk fails
          for (const stock of batchStockChunk) {
            try {
              await BatchStock.create(stock);
              batchStockSuccessCount++;
            } catch (singleError) {
              console.error(`Error creating batch stock for ${stock.code_product}:`, singleError);
              errors.push({
                code_product: stock.code_product,
                error: `Error creating batch stock: ${singleError.message}`
              });
            }
          }
        }
      }
      
      console.log(`Successfully created ${batchStockSuccessCount}/${batchStocksToCreate.length} batch stocks`);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    
    // Final counts
    successCount = successfulProducts.size;
    
    console.log(`Proses impor selesai dalam ${elapsed.toFixed(2)} detik`);
    console.log(`Total data diproses: ${processedCount}, Sukses: ${successCount}, Error: ${errors.length}`);
    
    // Add validation errors count to the response
    res.json({
      message: `Import selesai: ${successCount} berhasil dari total ${processedCount} data dengan ${errors.length} error`,
      total_data: processedCount,
      success_count: successCount,
      error_count: errors.length,
      validation_errors: validationErrors.size,
      batch_stock_count: batchStocksToCreate.length,
      elapsed_time: `${elapsed.toFixed(2)} detik`,
      errors: errors.length > 0 ? errors.slice(0, 20) : null,
    });

  } catch (error) {
    console.error('Error utama:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const code_categories = req.query.code_categories || "";
    const offset = limit * page;

    const { count, rows } = await Product.findAndCountAll({
      where: {
        [Op.or]: [
          { code_product: { [Op.like]: `%${search}%` } },
          { name_product: { [Op.like]: `%${search}%` } },
          { barcode: { [Op.like]: `%${search}%` } },
        ],
        ...(code_categories && { code_categories }),
        deleted_at: null,
      },
      include: [
        {
          model: Categories,
          attributes: ["code_categories", "name_categories"],
        },
      ],
      offset: offset,
      limit: limit,
      order: [["name_product", "ASC"]],
    });

    res.json({
      result: rows,
      page: page,
      limit: limit,
      totalRows: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        code_product: req.params.id,
        deleted_at: null,
      },
      include: [
        {
          model: Categories,
          attributes: ["code_categories", "name_categories"],
        },
      ],
    });

    const formattedRows = rows.map(item => {
      const plainItem = item.get({ plain: true });
      
      // Convert code_product and barcode to string
      if (plainItem.code_product) {
          plainItem.code_product = String(plainItem.code_product);
      }
      
      if (plainItem.barcode) {
          plainItem.barcode = String(plainItem.barcode);
      }
      
      return plainItem;
  });
  
  res.json({
      result: formattedRows,
      page: page,
      limit: limit,
      totalRows: count,
      totalPages: Math.ceil(count / limit),
  });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    // Check if categories exists
    if (req.body.code_categories) {
      const category = await Categories.findByPk(req.body.code_categories);
      if (!category) {
        return res.status(400).json({ message: "Category does not exist" });
      }
    }

    // Check if product already exists
    const existingProduct = await Product.findByPk(req.body.code_product);
    if (existingProduct) {
      return res.status(400).json({ message: "Product with this code already exists" });
    }

    // Set timestamps
    const now = new Date();
    req.body.created_at = now;
    req.body.updated_at = now;

    const product = await Product.create(req.body);
    res.status(201).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        code_product: req.params.id,
        deleted_at: null,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If category is changed, check if new category exists
    if (req.body.code_categories && req.body.code_categories !== product.code_categories) {
      const category = await Categories.findByPk(req.body.code_categories);
      if (!category) {
        return res.status(400).json({ message: "Category does not exist" });
      }
    }

    // Set updated timestamp
    req.body.updated_at = new Date();

    await Product.update(req.body, {
      where: {
        code_product: req.params.id,
      },
    });

    res.json({
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        code_product: req.params.id,
        deleted_at: null,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.update(
      { deleted_at: new Date() },
      { where: { code_product: req.params.id } }
    );

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Categories.findAll({
      attributes: ["code_categories", "name_categories"],
      where: {
        deleted_at: null,
      },
    });

    res.json({
      result: categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Categories.findOne({
      where: {
        code_categories: req.params.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  try {
    // Check if category already exists
    const existingCategory = await Categories.findByPk(req.body.code_categories);
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this code already exists" });
    }

    // Set timestamps
    const now = new Date();
    req.body.created_at = now;
    req.body.updated_at = now;

    const category = await Categories.create(req.body);
    res.status(201).json({
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const category = await Categories.findOne({
      where: {
        code_categories: req.params.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Set updated timestamp
    req.body.updated_at = new Date();

    await Categories.update(req.body, {
      where: {
        code_categories: req.params.id,
      },
    });

    res.json({
      message: "Category updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Categories.findOne({
      where: {
        code_categories: req.params.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Categories.update(
      { deleted_at: new Date() },
      { where: { code_categories: req.params.id } }
    );

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};