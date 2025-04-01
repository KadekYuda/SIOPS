import BatchStok from "../models/BatchstockModel.js";
import Products from "../models/ProductModel.js";
import { Op, Sequelize } from "sequelize";

export const getBatchStok = async (req, res) => {
    try {
        let { page, limit, search } = req.query;

        page = parseInt(page) || 0;
        limit = parseInt(limit) || 10;
        const offset = page * limit;

        let whereCondition = {};
        if (search) {
            whereCondition = {
                [Op.or]: [
                    { '$Product.name_product$': { [Op.like]: `%${search}%` } }, // Gunakan Op.like untuk MySQL
                    Sequelize.where(Sequelize.cast(Sequelize.col('Product.code_product'), 'CHAR'), {
                        [Op.like]: `%${search}%`
                    }),
                    Sequelize.where(Sequelize.cast(Sequelize.col('BatchStok.stock_quantity'), 'CHAR'), {
                        [Op.like]: `%${search}%`
                    })
                ]
            };
        }

        const { count, rows } = await BatchStok.findAndCountAll({
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product']
            }],
            where: whereCondition,
            order: [['batch_id', 'DESC']],
            limit: limit,
            offset: offset,
            distinct: true
        });

        const formattedResponse = rows.map(item => {
            const plainItem = item.get({ plain: true });
            if (plainItem.Product && plainItem.Product.code_product) {
                plainItem.Product.code_product = String(plainItem.Product.code_product);
            }
            if (plainItem.code_product) {
                plainItem.code_product = String(plainItem.code_product);
            }
            return plainItem;
        });

        res.status(200).json({
            result: formattedResponse,
            totalRows: count,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error in getBatchStok:", error); // Tambahkan logging
        res.status(500).json({ msg: error.message });
    }
};
export const getBatchStokById = async (req, res) => {
    try {
        const response = await BatchStok.findOne({
            where: {
                batch_id: req.params.batch_id
            },
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product'] // Pastikan kolom ini ada di tabel Products
            }]
        });
        if (!response) return res.status(404).json({ msg: "Batch stock not found" });
        
        // Format the response
        const plainResponse = response.get({ plain: true });
        if (plainResponse.Product && plainResponse.Product.code_product) {
            plainResponse.Product.code_product = String(plainResponse.Product.code_product);
        }
        if (plainResponse.code_product) {
            plainResponse.code_product = String(plainResponse.code_product);
        }
        
        res.status(200).json({ result: plainResponse });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getBatchStokByProductCode = async (req, res) => {
    try {
        const response = await BatchStok.findAll({
            where: {
                kdbar: req.params.product_code
            },
            include: [{
                model: Products,
                attributes: ['code_product', 'name_product'] // Pastikan kolom ini ada di tabel Products
            }],
            order: [['exp_date', 'ASC']]
        });
        res.status(200).json({ result: response });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Disable create, update, and delete operations
export const createBatchStok = async (req, res) => {
    res.status(403).json({ msg: "Operation not allowed" });
};

export const updateBatchStok = async (req, res) => {
    res.status(403).json({ msg: "Operation not allowed" });
};

export const deleteBatchStok = async (req, res) => {
    res.status(403).json({ msg: "Operation not allowed" });
};
