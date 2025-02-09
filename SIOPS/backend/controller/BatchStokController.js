import BatchStok from "../models/BatchStokModel.js";
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
        res.status(200).json(response);
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
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createBatchStok = async (req, res) => {
    const { kdbar, hbeli, stok, tgl_masuk } = req.body;
    try {
        const product = await Products.findByPk(kdbar);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        await BatchStok.create({
            kdbar,
            hbeli,
            stok,
            tgl_masuk: tgl_masuk || new Date()
        });
        res.status(201).json({ msg: "Batch stock created successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

export const updateBatchStok = async (req, res) => {
    const { kdbar, hbeli, stok, tgl_masuk } = req.body;
    try {
        const batchStok = await BatchStok.findOne({
            where: {
                batch_id: req.params.batch_id
            }
        });
        if (!batchStok) return res.status(404).json({ msg: "Batch stock not found" });

        await batchStok.update({
            kdbar,
            hbeli,
            stok,
            tgl_masuk
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
