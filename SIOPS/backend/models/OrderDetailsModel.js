import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Order from "./OrderModel.js";
import BatchStock from "./BatchstockModel.js";
import Product from "./ProductModel.js";

const { DataTypes } = Sequelize;

const OrderDetail = db.define('order_details', {
    order_detail_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    order_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: Order , key: 'order_id' }
    },
    code_product:{
        type:DataTypes.STRING(13),
        allowNull:true,
        references: { model: Product, key: 'code_product'}
    }, 

    batch_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: BatchStock, key: 'batch_id' }
    },
    quantity: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    ordered_price: { 
        type: DataTypes.DECIMAL(12,2), 
        allowNull: false 
    },
    subtotal: { 
        type: DataTypes.DECIMAL(12,2), 
        allowNull: false 
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
}, { freezeTableName: true });




export default OrderDetail;