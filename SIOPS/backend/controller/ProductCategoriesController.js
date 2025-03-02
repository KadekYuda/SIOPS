import { Op } from "sequelize";
import Product from "../models/ProductModel.js";
import Categories from "../models/CategoriesModel.js";
import fs from "fs";
import path from "path";
import multer from "multer";
import { parse } from "csv-parse";



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
  try{
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded"});
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
    .pipe(parse({ delimiter: ",", columns: true, trim: true}))
    .on("data", async (row) => {
      const transformedRow = {
        code_product: row.KdBar || null,
        barcode: row.Barcode || null,
        name_product: row.Nmbar || null,
        code_categories: row.KdKel || null,
        sell_price: parseFloat(row.Hjual) || 0,
        min_stock: parseInt(row.StMin)  || 0
      };

      results.push(transformedRow);
    })
    .on("end", async() => {
      if (req.file) fs.unlinkSync(req.file.path);

      const now = new Date();
      for (const row of results){
        try{
          if (!row.code_product || !row.name_product) {
            errors.push({ row, error: "Missing required fields" });
            continue;
          }
          if (row.code_categories){
            let categories = await Categories.findByPk(row.code_categories);
            if (!categories) {
              // Buat kategori baru jika tidak ditemukan
              categories = await Categories.create({
                code_categories: row.code_categories,
                name_categories: `${row.code_categories}`,
                created_at: now,
                updated_at: now,
              });
            }
            row.code_categories = category.code_categories; // Pastikan kode kategori valid
          }

          const productData = {
            ...row,
            created_at: now,
            updated_at: now,
          }

          const [product, created] = await Product.findOrCreate({
            where: {code_product: productData.code_product },
            defaults: productData,
          });

          if (!created) {
            await product.update(productData); 
          }
        } catch (error) {
          errors.push({ row, error: error.message});
        }
      }
      res.json({
        message: `CSV Processed: ${results.length - errors.length} products imported successfully`,
        errors: errors.length > 0 ? errors : null,
      });
    })
  } catch (error) {
    res.status(500).json({ message: error.message});
  }
}

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