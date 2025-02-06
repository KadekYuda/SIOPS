import Products from "../models/ProductModel.js";
import { parse } from "csv-parse/sync";
import fs from "fs";


export const importProductsFromCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // Get model attributes
        const modelAttributes = Object.keys(Products.rawAttributes);

        // Read and parse CSV
        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Validate and filter records
        const validRecords = records.map(record => {
            const filteredRecord = {};
            for (const [key, value] of Object.entries(record)) {
                const normalizedKey = key.toLowerCase();
                if (modelAttributes.includes(normalizedKey)) {
                    filteredRecord[normalizedKey] = value;
                }
            }
            return filteredRecord;
        });

        // Bulk create valid records
        const result = await Products.bulkCreate(validRecords, {
            validate: true,
            ignoreDuplicates: true
        });

        // Delete the uploaded file
        fs.unlinkSync(filePath);

        res.status(201).json({
            msg: "CSV imported successfully",
            totalRecords: records.length,
            importedRecords: result.length,
            skippedRecords: records.length - result.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            msg: error.message,
            details: error.errors?.map(err => err.message) 
        });
    }
};

export const getProducts = async (req, res) => {
    try {
        const response = await Products.findAll({
            order: [['nmbar', 'ASC']]
        });
        res.status(200).json(response || []); // Return array directly and ensure it's not null
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const response = await Products.findOne({
            where: {
                kdbar: req.params.id
            }
        });
        if (!response) return res.status(404).json({ msg: "Product not found" });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createProduct = async (req, res) => {
    const { kdbar, barcode, nmbar, kdkel, hjual, markup } = req.body;
    try {
        await Products.create({
            kdbar,
            barcode,
            nmbar,
            kdkel,
            hjual,
            markup
        });
        res.status(201).json({ msg: "Product created successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const updateProduct = async (req, res) => {
    const product = await Products.findOne({
        where: {
            kdbar: req.params.id
        }
    });
    if (!product) return res.status(404).json({ msg: "Product not found" });
    const { kdbar, barcode, nmbar, kdkel, hjual, markup } = req.body;
    try {
        await Products.update({
            kdbar,
            barcode,
            nmbar,
            kdkel,
            hjual,
            markup
        }, {
            where: {
                kdbar: req.params.id
            }
        });
        res.status(200).json({ msg: "Product updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    const product = await Products.findOne({
        where: {
            kdbar: req.params.id
        }
    });
    if (!product) return res.status(404).json({ msg: "Product not found" });
    try {
        await Products.destroy({
            where: {
                kdbar: req.params.id
            }
        });
        res.status(200).json({ msg: "Product deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};