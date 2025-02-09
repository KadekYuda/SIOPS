import Products from "../models/ProductModel.js";
import { Op } from "sequelize";
import fs from "fs";
import csv from "fast-csv";

// Get all products with search and pagination
export const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const kdkel = req.query.kdkel || "";
        const offset = limit * page;

        const whereClause = {
            [Op.or]: [
                {
                    kdbar: {
                        [Op.like]: '%' + search.toLowerCase() + '%'
                    }
                },
                {
                    nmbar: {
                        [Op.like]: '%' + search.toLowerCase() + '%'
                    }
                }
            ]
        };

        // Add category filter if provided
        if (kdkel) {
            whereClause.kdkel = kdkel;
        }

        const totalRows = await Products.count({
            where: whereClause
        });

        const totalPage = Math.ceil(totalRows / limit);

        const result = await Products.findAll({
            where: whereClause,
            offset: offset,
            limit: limit,
            order: [
                ['kdbar', 'ASC']
            ]
        });

        res.json({
            result: result,
            page: page,
            limit: limit,
            totalRows: totalRows,
            totalPage: totalPage
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Get a single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Products.findOne({
            where: {
                kdbar: req.params.id
            }
        });
        if (!product) return res.status(404).json({ msg: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Create a new product
export const createProduct = async (req, res) => {
    try {
        const { kdbar, barcode, nmbar, kdkel, hjual, markup } = req.body;
        
        // Check if product already exists
        const existingProduct = await Products.findOne({
            where: {
                kdbar: kdbar
            }
        });
        
        if (existingProduct) {
            return res.status(400).json({ msg: "Product code already exists" });
        }
        if (!kdbar || !nmbar) {
            return res.status(400).json({ msg: "kdbar and nmbar are required" });
        }
        await Products.create({
            kdbar: kdbar,
            barcode: barcode,
            nmbar: nmbar,
            kdkel: kdkel,
            hjual: hjual,
            markup: markup
        });

        res.json({ msg: "Product created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Update a product
export const updateProduct = async (req, res) => {
    try {
        const product = await Products.findOne({
            where: {
                kdbar: req.params.id
            }
        });
        
        if (!product) return res.status(404).json({ msg: "Product not found" });

        const { barcode, nmbar, kdkel, hjual, markup } = req.body;

        await Products.update({
            barcode: barcode,
            nmbar: nmbar,
            kdkel: kdkel,
            hjual: hjual,
            markup: markup
        }, {
            where: {
                kdbar: req.params.id
            }
        });

        res.json({ msg: "Product updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Products.findOne({
            where: {
                kdbar: req.params.id
            }
        });
        
        if (!product) return res.status(404).json({ msg: "Product not found" });

        await Products.destroy({
            where: {
                kdbar: req.params.id
            }
        });

        res.json({ msg: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Import products from CSV
export const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Please upload a CSV file" });
        }

        const products = [];
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(csv.parse({ headers: true }))
            .on('error', error => {
                throw error.message;
            })
            .on('data', row => {
                products.push({
                    kdbar: row.kdbar,
                    barcode: row.barcode,
                    nmbar: row.nmbar,
                    kdkel: row.kdkel,
                    hjual: parseFloat(row.hjual) || 0,
                    markup: parseFloat(row.markup) || 0
                });
            })
            .on('end', async () => {
                // Remove uploaded file
                fs.unlinkSync(req.file.path);

                // Validate and insert products
                for (let product of products) {
                    try {
                        await Products.bulkCreate(products, {
                            validate: true,
                            ignoreDuplicates: true
                        });
                    } catch (error) {
                        errors.push(`Error on row ${product.kdbar}: ${error.message}`);
                    }
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        msg: "Some products failed to import",
                        errors: errors
                    });
                }

                res.json({ msg: "All products imported successfully" });
            });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}