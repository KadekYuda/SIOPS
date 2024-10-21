import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import UserRoute from "./routes/UserRoute.js";
import OrderRoute from "./routes/OrderRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload())


app.use(UserRoute);
app.use(OrderRoute);

app.listen(5000, () => console.log('Server is running on port 5000'));

