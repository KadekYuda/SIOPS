import BatchStok from "../models/BatchstockModel.js";
import Products from "../models/ProductModel.js";
import { Op } from "sequelize";



export const getBatchStok = async (req, res) => {
    try {
        let { page, limit, search } = req.query;

        page = parseInt(page) || 0;
        limit = parseInt(limit) || 5;
        const offset = page * limit;

        // Kondisi pencarian
        const whereCondition = {};
        
        // Jika ada pencarian
        if (search) {
            whereCondition[Op.or] = [
                { batch_code: { [Op.like]: `%${search}%` } },
                { code_product: { [Op.like]: `%${search}%` } }
                // Tambahkan field lain jika perlu
            ];
        }

        // Query dengan kondisi
        const { count, rows } = await BatchStok.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: Products,
                    attributes: ['code_product', 'name_product'],
                    required: false // Tidak wajib ada hasil dari Products
                }
            ],
            order: [['batch_id', 'DESC']],
            limit: limit,
            offset: offset,
            distinct: true
        });

        // Format respons
        const formattedResponse = rows.map(item => {
            const plainItem = item.get({ plain: true });
            // Format kode produk menjadi string
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
        console.error("Error in getBatchStok:", error);
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


export const getMinimumStockAlert = async (req, res) => {
    try{
        const products = await Products.findAll();

        const alerts = []

        for (const product of products) {
            const batches = await BatchStok.findAll({
                where: {code_product: product.code_product},
            });

            const totalStock = batches.reduce((acc, batch) => {
            const remaining = batch.stock_quantity - (batch.used_stock || 0);
            return acc + remaining;

        }, 0)

        if (totalStock <= product.min_stock) {
            alerts.push ({
                code_product: product.code_product,
                name_product: product.name_product,
                min_stock: product.min_stock,
                current_stock: totalStock,
            });
        }
    }

    res.status(200).json(alerts);
} catch (error){
    console.error("Error fetching minimum stock alerts:", error);
    res.status(500).json({ msg: error.message });
}
}




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

