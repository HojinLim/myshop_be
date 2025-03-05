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
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    product_option_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    added_at: {
      type: DataTypes.DATE,
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
// 관계 설정 (Cart 모델에서 User 모델을 참조)
Cart.belongsTo(User, {
  foreignKey: 'user_id', // product_id가 외래 키로 참조
  onDelete: 'CASCADE', // 부모 테이블이 삭제되면 관련된 자식 테이블도 삭제
});

module.exports = Cart;
