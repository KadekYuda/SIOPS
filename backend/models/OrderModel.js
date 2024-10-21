import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Order = db.define('orders', {
    noPembelian: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    kodebarang: {
        type: DataTypes.STRING,
        allowNull: false
    },
    barcode: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    namaBarang: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hargaBeli: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jumlahBeli: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    freezeTableName: true
});
db.sync({ alter: true });
// Export the model
export default Order;

(async()=>{
    await db.sync();
})()
