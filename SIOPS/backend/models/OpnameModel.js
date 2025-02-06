import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Products from "./ProductModel.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Opname = db.define('opnames', {
    opname_id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    kdbar: { 
        type: DataTypes.STRING(13), 
        allowNull: false,
        references: {
            model: Products,
            key: 'kdbar'
        }
    },
    stok_sistem: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    stok_fisik: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    selisih: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    tgl_opname: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: Sequelize.NOW 
    },
    users_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,
            key: 'user_id'
        }
    }
}, { 
    freezeTableName: true 
});

export default Opname;