import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log directory contents
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync(process.cwd()));
console.log('Config directory contents:', fs.readdirSync(join(process.cwd(), 'config')));

// Use absolute path for imports
const dbPath = join(__dirname, 'config', 'database.js');
console.log('Database path:', dbPath);
console.log('Database file exists:', fs.existsSync(dbPath));

const { default: database, initDB } = await import(`file://${dbPath}`);
import { initializeDatabase } from "./models/index.js";
import UserRoute from "./routes/UserRoute.js";
import OrderRoute from "./routes/OrderRoutes.js";
import ProductCategoriesRoute from "./routes/ProductCategoriesRoute.js";
import BatchStockRoute from "./routes/BatchStockRoute.js";
import OpnameRoute from "./routes/OpnameRoute.js";
import SalesRoute from "./routes/SalesRoute.js";
import initializeAdmin from "./utils/initializeAdmin.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000', 
            'http://localhost:5000',
            'https://simsop-frontend.vercel.app',
            'https://simsop.vercel.app',
            'https://siops-production.up.railway.app'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Error handling middleware
app.use((err, req, res, next) => {
    if (res.headersSent){
        return next(err);
    }
    console.error(err.stack);
    res.status(500).json({ 
        msg: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Routes
app.use('/api/users', UserRoute);
app.use('/api/orders', OrderRoute);
app.use('/api', ProductCategoriesRoute);
app.use('/api/batch', BatchStockRoute);
app.use('/api/opname', OpnameRoute);
app.use('/api/sales', SalesRoute);

// Create uploads directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
    mkdirSync('./uploads', { recursive: true });
} catch (err) {
    if (err.code !== 'EEXIST') {
        console.error('Error creating uploads directory:', err);
    }
}

// Start the application
(async () => {    try {        // Test database connection
        await database.authenticate();
        console.log('Database connected...');

        // Initialize database and relationships
        await initDB();
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