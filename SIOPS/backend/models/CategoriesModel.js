import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Categories = db.define('categories', {
    kdkel: { 
        type: DataTypes.STRING(4),
        allowNull: false,
        primaryKey: true,
    },
    nmkel: {
        type: DataTypes.STRING(30),
        allowNull: false
    }
}, {
    freezeTableName: true
});

export default Categories;