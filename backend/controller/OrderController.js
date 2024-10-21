import Order from "../models/OrderModel.js";





// Get all orders
export const getOrders = async (req, res) => {
    try {
        const response = await Order.findAll();
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error fetching orders" });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const response = await Order.findOne({
            where: { id: req.params.id }
        });
        if (!response) return res.status(404).json({ message: "Order not found" });
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error fetching order" });
    }
};


export const createOrder = async (req, res) => {
    try {
        const { noPembelian, date, kodebarang, barcode, namaBarang, hargaBeli, jumlahBeli } = req.body;

        if (!noPembelian || !date || !kodebarang || !barcode || !namaBarang || !hargaBeli || !jumlahBeli) {
            return res.status(400).json({
                message: 'Missing required fields',
                errors: {
                    noPembelian: !noPembelian ? 'No Pembelian is required' : undefined,
                    date: !date ? 'Date is required' : undefined,
                    kodebarang: !kodebarang ? 'Kode Barang is required' : undefined,
                    barcode: !barcode ? 'Barcode is required' : undefined,
                    namaBarang: !namaBarang ? 'Nama Barang is required' : undefined,
                    hargaBeli: !hargaBeli ? 'Harga Beli is required' : undefined,
                    jumlahBeli: !jumlahBeli ? 'Jumlah Beli is required' : undefined,
                },
            });
        }

        const newOrder = await Order.create({
            noPembelian,
            date,
            kodebarang,
            barcode,
            namaBarang,
            hargaBeli,
            jumlahBeli
        });

        res.status(201).json(newOrder);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Error creating order' });
    }   
};



// Update order by ID
export const updateOrder = async (req, res) => {
    try {
        const { noPembelian, date, kodebarang, barcode, namaBarang, hargaBeli, jumlahBeli } = req.body;
        await Order.update({
            noPembelian,
            date,
            kodebarang,
            barcode,
            namaBarang,
            hargaBeli,
            jumlahBeli
        }, {
            where: { id: req.params.id }
        });
        res.status(200).json({ msg: "Order Updated" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error updating order" });
    }
};


// Delete order by ID
export const deleteOrder = async (req, res) => {
    try {
        await Order.destroy({
            where: { id: req.params.id }
        });
        res.status(200).json({ msg: "Order Deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error deleting order" });
    }
};

