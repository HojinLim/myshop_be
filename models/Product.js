const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const product_options = require('./product_options'); // ✅ Product 모델 가져오기

const Product = sequelize.define(
  'Product',
  {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originPrice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discountPrice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    freezeTableName: true,
  }
);

module.exports = Product;
