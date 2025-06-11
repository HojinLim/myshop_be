const { DataTypes } = require('sequelize');

const sequelize = require('../config/sequelize');

const point_history = sequelize.define(
  'point_history',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // 결제 관련이 아닌 경우도 있을 수 있음
      references: {
        model: 'order',
        key: 'id',
      },
    },
    point: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '변동된 포인트 값 (양수: 적립, 음수: 차감)',
    },
    type: {
      type: DataTypes.ENUM('used', 'saved', 'refunded', 'event', 'admin'),
      allowNull: false,
      comment: '포인트 내역 타입',
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment:
        '내역 설명 (예: 첫 구매 적립, 주문 12 포인트 사용, 관리자 수동 지급 등)',
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

module.exports = point_history;
