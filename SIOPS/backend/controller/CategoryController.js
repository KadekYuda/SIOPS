import Categories from "../models/CategoriesModel.js";

export const getCategories = async (req, res) => {
    try {
        const response = await Categories.findAll({
            order: [['nmkel', 'ASC']]
        });
        res.status(200).json({
            result: response
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            }
        });
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCategory = async (req, res) => {
    const { kdkel, nmkel } = req.body;
    try {
        const existingCategory = await Categories.findOne({
            where: {
                kdkel: kdkel
            }
        });

        if (existingCategory) {
            return res.status(400).json({ message: "Category code already exists" });
        }

        await Categories.create({
            kdkel: kdkel,
            nmkel: nmkel
        });
        res.status(201).json({ message: "Category created successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateCategory = async (req, res) => {
    const { kdkel, nmkel } = req.body;
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            }
        });
        
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await Categories.update({
            kdkel: kdkel,
            nmkel: nmkel
        }, {
            where: {
                kdkel: req.params.id
            }
        });
        res.status(200).json({ message: "Category updated successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const category = await Categories.findOne({
            where: {
                kdkel: req.params.id
            }
        });
        
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await Categories.destroy({
            where: {
                kdkel: req.params.id
            }
        });
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
