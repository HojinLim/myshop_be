const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');
const Product = require('./Product');

const product_options = sequelize.define(
  'product_options',
  {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Product',
        key: 'id',
      },
    },
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
// 관계 설정 (product_options 모델에서 products 모델을 참조)
product_options.belongsTo(Product, {
  foreignKey: 'product_id', // product_id가 외래 키로 참조
  onDelete: 'CASCADE', // 부모 테이블이 삭제되면 관련된 자식 테이블도 삭제
});

module.exports = product_options;
