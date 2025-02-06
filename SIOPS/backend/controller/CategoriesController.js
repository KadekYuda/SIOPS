import { Op } from "sequelize";
import Categories from "../models/CategoriesModel.js";
import Products from "../models/ProductModel.js";

// Get all categories with optional search and pagination
export const getCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = limit * page;

        const totalRows = await Categories.count({
            where: {
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
            }
        });
        const totalPage = Math.ceil(totalRows / limit);

        const categories = await Categories.findAll({
            where: {
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
            },
            offset: offset,
            limit: limit,
            order: [['kdkel', 'ASC']]
        });

        res.json({
            result: categories,
            page: page,
            limit: limit,
            totalRows: totalRows,
            totalPage: totalPage
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            },
            include: [{
                model: Products,
                attributes: ['kdbar', 'nmbar', 'stok']
            }]
        });
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new category
export const createCategory = async (req, res) => {
    try {
        // Check if category code already exists
        const existingCategory = await Categories.findByPk(req.body.kdkel);
        if (existingCategory) {
            return res.status(400).json({ message: "Category code already exists" });
        }

        const category = await Categories.create(req.body);
        res.status(201).json({
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const category = await Categories.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        await Categories.update(req.body, {
            where: {
                kdkel: req.params.id
            }
        });

        res.json({
            message: "Category updated successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const category = await Categories.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        // Check if category has products
        const productsCount = await Products.count({
            where: {
                kdkel: req.params.id
            }
        });

        if (productsCount > 0) {
            return res.status(400).json({ 
                message: "Cannot delete category. It has associated products.",
                productsCount: productsCount
            });
        }

        await Categories.destroy({
            where: {
                kdkel: req.params.id
            }
        });

        res.json({
            message: "Category deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
