import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db, { initDB } from "./config/Database.js";
import { initializeDatabase } from "./models/index.js";
import UserRoute from "./routes/UserRoute.js";
import OrderRoute from "./routes/OrderRoutes.js";
import ProductRoute from "./routes/ProductRoute.js";
import CategoryRoute from "./routes/CategoryRoute.js";
import initializeAdmin from "./utils/initializeAdmin.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Routes
app.use('/users', UserRoute);
app.use('/orders', OrderRoute);
app.use('/products', ProductRoute);
app.use('/categories', CategoryRoute);

// Start the application
(async () => {
    try {
        // Initialize database first
        await initDB();
        
        // Test database connection
        await db.authenticate();
        console.log('Database connected...');

        // Initialize models and update tables
        await initializeDatabase();

        // Initialize admin user
        await initializeAdmin();
        console.log('Admin user initialized');

        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
})();