const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const product_image = sequelize.define(
  'product_image',
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
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_url: {
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
    freezeTableName: true, // 테이블 이름을 모델명 그대로 사용
  }
);
// 관계 설정
product_image.belongsTo(Product, {
  foreignKey: 'product_id', // product_id가 외래 키로 참조
  onDelete: 'CASCADE', // 부모 테이블이 삭제되면 관련된 자식 테이블도 삭제
});

module.exports = product_image;
