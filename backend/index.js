import express from "express";
import cors from "cors";
import UserRoute from "./routes/UserRoute.js";
import OrderRoute from "./routes/OrderRoutes.js";
import dotenv from "dotenv";
import db from "./config/Database.js";
import initializeAdmin from "./utils/initializeAdmin.js";

dotenv.config();

const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(UserRoute);
app.use(OrderRoute);

(async () => {
    try {
      await db.sync(); // Sinkronisasi database
      await initializeAdmin(); // Inisialisasi admin default
      console.log("Database synced and admin initialized.");
    } catch (error) {
      console.error("Error syncing database or initializing admin:", error);
    }
  })();
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server is running on port 5000'));

