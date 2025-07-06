const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const review = sequelize.define(
  'review',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    option_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER, // 1~5 점수
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
    },
    height: {
      type: DataTypes.INTEGER,
    },
    weight: {
      type: DataTypes.INTEGER,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true, // 테이블 이름을 모델명 그대로 사용
  }
);

module.exports = review;
