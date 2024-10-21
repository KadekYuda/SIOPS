import { Sequelize } from "sequelize";

const db = new Sequelize('order_db','root','',{
    host: 'localhost',
    dialect: 'mysql'
});

export default db;