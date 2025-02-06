import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Products from "./ProductModel.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Order = db.define('orders', {
    order_id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    kdbar: { 
        type: DataTypes.STRING(13), 
        allowNull: false,
        references: {
            model: Products,
            key: 'kdbar'
        }
    },
    jumlah: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    harga: { 
        type: DataTypes.DECIMAL(12,2), 
        allowNull: false 
    },
    tipe_order: { 
        type: DataTypes.ENUM('Masuk', 'Keluar'), 
        allowNull: false 
    },
    tgl_order: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: Sequelize.NOW 
    },
    users_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: Users,
            key: 'user_id'
        }
    }
}, { 
    freezeTableName: true 
});

// Define associations
Order.belongsTo(Products, { foreignKey: 'kdbar' });
Products.hasMany(Order, { foreignKey: 'kdbar' });

Order.belongsTo(Users, { foreignKey: 'users_id' });
Users.hasMany(Order, { foreignKey: 'users_id' });

export default Order;