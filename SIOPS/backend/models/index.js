'use strict';

import { Sequelize } from "sequelize";
import db from "../config/Database.js";

// Import models
import Products from "./ProductModel.js";
import Users from "./UserModel.js";
import Order from "./OrderModel.js";
import Categories from "./CategoriesModel.js";
import Opname from "./OpnameModel.js";
import BatchStok from "./BatchStokModel.js";

// Define associations
const initializeAssociations = () => {
    // Products and Categories
    Products.belongsTo(Categories, {
        foreignKey: 'kdkel',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });
    Categories.hasMany(Products, {
        foreignKey: 'kdkel'
    });

    // Products and Orders
    Products.hasMany(Order, {
        foreignKey: 'kdbar',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Order.belongsTo(Products, {
        foreignKey: 'kdbar'
    });

    // Users and Orders
    Users.hasMany(Order, {
        foreignKey: 'users_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Order.belongsTo(Users, {
        foreignKey: 'users_id'
    });

    // Products and Opname
    Products.hasMany(Opname, {
        foreignKey: 'kdbar',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Opname.belongsTo(Products, {
        foreignKey: 'kdbar'
    });

    // Users and Opname
    Users.hasMany(Opname, {
        foreignKey: 'users_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    Opname.belongsTo(Users, {
        foreignKey: 'users_id'
    });

    // Products and BatchStok
    Products.hasMany(BatchStok, {
        foreignKey: 'kdbar',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
    BatchStok.belongsTo(Products, {
        foreignKey: 'kdbar'
    });
};

// Initialize database
const initializeDatabase = async () => {
    try {
        // Initialize associations first
        initializeAssociations();

        // Check if tables exist
        const [results] = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'siops_db'
        `);
        const existingTables = results.map(r => r.TABLE_NAME.toLowerCase());

        // Only create/alter tables that don't exist or need updates
        const syncOptions = { alter: true };

        if (!existingTables.includes('categories')) {
            await Categories.sync(syncOptions);
            console.log('Categories table checked/updated');
        }

        if (!existingTables.includes('products')) {
            await Products.sync(syncOptions);
            console.log('Products table checked/updated');
        }

        if (!existingTables.includes('users')) {
            await Users.sync(syncOptions);
            console.log('Users table checked/updated');
        }

        if (!existingTables.includes('orders')) {
            await Order.sync(syncOptions);
            console.log('Orders table checked/updated');
        }

        if (!existingTables.includes('opnames')) {
            await Opname.sync(syncOptions);
            console.log('Opnames table checked/updated');
        }

        if (!existingTables.includes('batch_stok')) {
            await BatchStok.sync(syncOptions);
            console.log('BatchStok table checked/updated');
        }

        console.log('All tables are up to date!');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Export models and initialization function
export {
    Products,
    Users,
    Order,
    Categories,
    Opname,
    BatchStok,
    initializeDatabase
};
