
import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Products = db.define('products', {
    kdbar: {
        type: DataTypes.STRING(13),
        allowNull: false,
        primaryKey: true
    },
    barcode: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    nmbar: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    kdkel: {
        type: DataTypes.STRING(4),
        allowNull: true
    },
    hjual: {  
        type: DataTypes.DECIMAL(12,2),
        allowNull: false,
        defaultValue: 0.00
    },
    markup: {
        type: DataTypes.DECIMAL(10,5),
        allowNull: true,
        defaultValue: 0.00000
    }
}, {
    freezeTableName: true
});

export default Products;