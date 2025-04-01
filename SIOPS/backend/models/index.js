'use strict';

import db from "../config/Database.js";

// Import models
import Product from "./ProductModel.js";
import User from "./UserModel.js";
import Order from "./OrderModel.js";
import Categories from "./CategoriesModel.js";
import Opname from "./OpnameModel.js";
import BatchStock from "./BatchstockModel.js";
import Sales from "./SalesModel.js";
import SalesDetail from "./SalesDetailModel.js";
import OrderDetail from "./OrderDetailsModel.js";

const initializeAssociations = () => {
    // Users associations
    User.hasMany(Order, { foreignKey: 'user_id' });
    User.hasMany(Sales, { foreignKey: 'user_id' });
    User.hasMany(Opname, { foreignKey: 'user_id' });

    Order.belongsTo(User, { foreignKey: 'user_id' });
    Sales.belongsTo(User, { foreignKey: 'user_id' });
    Opname.belongsTo(User, { foreignKey: 'user_id' });

    // Categories associations
    Categories.hasMany(Product, { foreignKey: 'code_categories' });
    Product.belongsTo(Categories, { foreignKey: 'code_categories' });

    // Products associations
    Product.hasMany(BatchStock, { foreignKey: 'code_product' });
    BatchStock.belongsTo(Product, { foreignKey: 'code_product' });

    // Relasi Many-to-Many Order ↔ Products melalui OrderDetail
    Order.belongsToMany(Product, { through: OrderDetail, foreignKey: 'order_id', otherKey: 'code_product' });
    Product.belongsToMany(Order, { through: OrderDetail, foreignKey: 'code_product', otherKey: 'order_id' });

    Order.hasMany(OrderDetail, { foreignKey: 'order_id' });
    OrderDetail.belongsTo(Order, { foreignKey: 'order_id' });

    OrderDetail.belongsTo(Product, { foreignKey: 'code_product' });
    Product.hasMany(OrderDetail, { foreignKey: 'code_product' });

    OrderDetail.belongsTo(BatchStock, { foreignKey: 'batch_id' });
    BatchStock.hasMany(OrderDetail, { foreignKey: 'batch_id' });

    // Relasi Many-to-Many Sales ↔ Products melalui SalesDetail
    Sales.belongsToMany(Product, { through: SalesDetail, foreignKey: 'sales_id', otherKey: 'code_product' });
    Product.belongsToMany(Sales, { through: SalesDetail, foreignKey: 'code_product', otherKey: 'sales_id' });

    Sales.hasMany(SalesDetail, { foreignKey: 'sales_id' });
    SalesDetail.belongsTo(Sales, { foreignKey: 'sales_id' });

    SalesDetail.belongsTo(Product, { foreignKey: 'code_product' });
    Product.hasMany(SalesDetail, { foreignKey: 'code_product' });

    SalesDetail.belongsTo(BatchStock, { foreignKey: 'batch_id' });
    BatchStock.hasMany(SalesDetail, { foreignKey: 'batch_id' });

    // ✅ Opname dan BatchStock (One-to-Many)
    Opname.belongsTo(BatchStock, { foreignKey: 'batch_id' });
    BatchStock.hasMany(Opname, { foreignKey: 'batch_id' });
};


// Initialize database
export const initializeDatabase = async () => {
    try {
        initializeAssociations();
        await db.sync({ force: false, alter: false });
        console.log('Database models synchronized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Export models and initialization function
export {
    Product,
    User,
    Order,
    Categories,
    Opname,
    BatchStock,
    Sales,
    SalesDetail,
    OrderDetail,
    initializeAssociations
};
