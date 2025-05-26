const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');
const User = require('./User');
const product_options = require('./product_options');

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
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    product_option_id: {
      // ✅ product_options 참조
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ProductOptions', // ✅ 올바른 관계 지정
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
// ✅ 관계 설정 (Cart → User)
Cart.belongsTo(User, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

// ✅ 관계 설정 (Cart → ProductOptions)
Cart.belongsTo(product_options, {
  foreignKey: 'product_option_id', // ✅ 수정됨
});

module.exports = Cart;
