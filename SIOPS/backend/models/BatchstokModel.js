import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const BatchStok = db.define('batch_stok', {
    batch_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kdbar: {
        type: DataTypes.STRING(13),
        allowNull: false,
        references: {
            model: 'products',
            key: 'kdbar'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    hbeli: {
        type: DataTypes.DECIMAL(12,2),
        allowNull: false,
        field: 'HBeli'
    },
    stok: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'Stok'
    },
    tgl_masuk: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'TanggalMasuk'
    }
}, {
    freezeTableName: true,
    timestamps: true
});

export default BatchStok;