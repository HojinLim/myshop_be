const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const Product = sequelize.define(
  'Product',
  {
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
      allowNull: false,
      unique: true,
    },
    originPrice: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    discountPrice: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    freezeTableName: true, // 테이블 이름을 모델명 그대로 사용
  }
);

module.exports = Product;
