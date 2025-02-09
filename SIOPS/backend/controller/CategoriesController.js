import Categories from "../models/CategoriesModel.js";
import { Op } from "sequelize";

// Get all categories with search and pagination
export const getCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = limit * page;

        const whereClause = {
            [Op.or]: [
                {
                    kdkel: {
                        [Op.like]: '%' + search + '%'
                    }
                },
                {
                    nmkel: {
                        [Op.like]: '%' + search + '%'
                    }
                }
            ]
        };

        const totalRows = await Categories.count({
            where: whereClause
        });

        const totalPage = Math.ceil(totalRows / limit);

        const result = await Categories.findAll({
            where: whereClause,
            offset: offset,
            limit: limit,
            order: [
                ['kdkel', 'ASC']
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

// Get a single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            }
        });
        if (!category) return res.status(404).json({ msg: "Category not found" });
        res.json(category);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { kdkel, nmkel } = req.body;
        
        // Check if category already exists
        const existingCategory = await Categories.findOne({
            where: {
                kdkel: kdkel
            }
        });
        
        if (existingCategory) {
            return res.status(400).json({ msg: "Category code already exists" });
        }

        // Validate category code length
        if (kdkel.length > 4) {
            return res.status(400).json({ msg: "Category code must not exceed 4 characters" });
        }

        await Categories.create({
            kdkel: kdkel,
            nmkel: nmkel
        });

        res.json({ msg: "Category created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            }
        });
        
        if (!category) return res.status(404).json({ msg: "Category not found" });

        const { nmkel } = req.body;

        await Categories.update({
            nmkel: nmkel
        }, {
            where: {
                kdkel: req.params.id
            }
        });

        res.json({ msg: "Category updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            }
        });
        
        if (!category) return res.status(404).json({ msg: "Category not found" });

        await Categories.destroy({
            where: {
                kdkel: req.params.id
            }
        });

        res.json({ msg: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
