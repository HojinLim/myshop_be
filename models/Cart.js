const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Cart = sequelize.define(
  'Cart',
  {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    product_option_id: {
      // product_options 참조
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_options',
        key: 'id',
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Product',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
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
    freezeTableName: true, // 테이블 이름을 모델명 그대로 사용
  }
);

module.exports = Cart;
