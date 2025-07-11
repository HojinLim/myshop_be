const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const order = sequelize.define(
  'order',
  {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'partial_refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    amount_paid_by_pg: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_paid_by_point: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imp_uid: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    freezeTableName: true, // 테이블 이름을 모델명 그대로 사용a
  }
);

module.exports = order;
