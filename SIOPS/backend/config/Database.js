import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";

const dbConfig = {
    name: "siops_db",
    username: "root",
    password: "",
    host: "localhost",
    dialect: "mysql",
    logging: false // Set to true if you want to see SQL queries
};

// Function to initialize database
export const initDB = async () => {
    try {
        // Create connection to MySQL server
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.username,
            password: dbConfig.password
        });

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.name}`);
        console.log(`Database ${dbConfig.name} checked/created successfully`);
        
        // Close the connection
        await connection.end();
        
        return true;
    } catch (error) {
        console.error("Database initialization error:", error);
        return false;
    }
};

// Create Sequelize instance with connection pool
const db = new Sequelize(dbConfig.name, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        freezeTableName: true,
        timestamps: true
    }
});

export default db;