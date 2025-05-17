const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Product = require('./Product'); // ✅ Product 모델 가져오기

const ProductImage = sequelize.define(
  'ProductImage',
  {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product, // ✅ Product 모델을 참조해야 함
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('main', 'detail'),
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

// ✅ 관계 설정
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = ProductImage;
