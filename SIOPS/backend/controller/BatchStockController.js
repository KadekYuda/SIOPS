import BatchStok from "../models/BatchstockModel.js";
import Products from "../models/ProductModel.js";

export const getBatchStok = async (req, res) => {
    try {
        const response = await BatchStok.findAll({
            include: [{
                model: Products,
                attributes: ['nmbar']
            }],
            order: [['batch_id', 'DESC']]
        });
        res.status(200).json({ result: response });
    } catch (error) {
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
                attributes: ['nmbar']
            }]
        });
        if (!response) return res.status(404).json({ msg: "Batch stock not found" });
        res.status(200).json({ result: response });
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
                attributes: ['nmbar']
            }],
            order: [['exp_date', 'ASC']]
        });
        res.status(200).json({ result: response });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createBatchStok = async (req, res) => {
    const { kdbar, batch, stok, purchase_price, exp_date } = req.body;
    try {
        const product = await Products.findByPk(kdbar);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        // Check if batch number already exists
        const existingBatch = await BatchStok.findOne({
            where: { batch }
        });
        if (existingBatch) {
            return res.status(400).json({ msg: "Batch number already exists" });
        }

        await BatchStok.create({
            kdbar,
            batch,
            hbeli: purchase_price,
            stok,
            tgl_masuk: new Date(),
            exp_date
        });
        res.status(201).json({ msg: "Batch stock created successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const updateBatchStok = async (req, res) => {
    const { kdbar, batch, stok, purchase_price, exp_date } = req.body;
    try {
        const batchStok = await BatchStok.findOne({
            where: {
                batch_id: req.params.batch_id
            }
        });
        if (!batchStok) return res.status(404).json({ msg: "Batch stock not found" });

        // Check if new batch number already exists (if changing batch number)
        if (batch !== batchStok.batch) {
            const existingBatch = await BatchStok.findOne({
                where: { batch }
            });
            if (existingBatch) {
                return res.status(400).json({ msg: "Batch number already exists" });
            }
        }

        await batchStok.update({
            kdbar,
            batch,
            hbeli: purchase_price,
            stok,
            exp_date
        });
        res.status(200).json({ msg: "Batch stock updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const deleteBatchStok = async (req, res) => {
    try {
        const batchStok = await BatchStok.findOne({
            where: {
                batch_id: req.params.batch_id
            }
        });
        if (!batchStok) return res.status(404).json({ msg: "Batch stock not found" });

        await batchStok.destroy();
        res.status(200).json({ msg: "Batch stock deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
