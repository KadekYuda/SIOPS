import { Sequelize } from "sequelize";
import db from "../config/Database.js";
const { DataTypes } = Sequelize;

const User = db.define('users', {
    user_id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: {
        type: DataTypes.ENUM('admin', 'staff'),
        defaultValue: 'staff' 
    },
    phone_number: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE, 
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
        
}, {
    freezeTableName: true
});
db.sync({ alter: true });

export default User;
