
const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/Database');

const History = db.define('history', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
});
db.sync({ alter: true });
module.exports = History;
