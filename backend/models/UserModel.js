import { Sequelize } from "sequelize";
import db from "../config/Database.js";
const { DataTypes } = Sequelize;

const User = db.define('users', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: {
        type: DataTypes.ENUM('admin', 'staff'),
        defaultValue: 'staff' 
    }
}, {
    freezeTableName: true
});
db.sync({ alter: true });

export default User;
