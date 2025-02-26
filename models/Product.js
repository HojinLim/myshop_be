const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const Product = sequelize.define('Product', {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
});

module.exports = Product;
