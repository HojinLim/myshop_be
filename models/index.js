// 주문
const order = require('./order');
const order_item = require('./order_item');
// 상품
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const product_options = require('./product_options');
const Cart = require('./Cart');
// 유저
const User = require('./User');
const point_history = require('./point_history');
const favorite = require('./favorite');
const review = require('./review');
const review_image = require('./review_image');
const review_like = require('./review_like');

// 관계 설정
order.hasMany(order_item, { foreignKey: 'order_id', onDelete: 'CASCADE' });
// order.belongsTo(Product, {
//   foreignKey: 'product_id',
//   onDelete: 'CASCADE',
// });
order_item.belongsTo(order, { foreignKey: 'order_id', onDelete: 'CASCADE' });
// order_item.belongsTo(Product, {
//   foreignKey: 'product_id',
//   onDelete: 'CASCADE',
// });
order_item.belongsTo(product_options, {
  foreignKey: 'option_id',
  onDelete: 'CASCADE',
});

point_history.belongsTo(User, { foreignKey: 'user_id' });
point_history.belongsTo(order, { foreignKey: 'order_id' });

Cart.belongsTo(User, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Cart.belongsTo(product_options, {
  foreignKey: 'product_option_id',
});

Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});
Product.hasMany(product_options, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});
Product.hasMany(review, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

product_options.belongsTo(Product, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

// favorite.associate = (models) => {
//   favorite.belongsTo(models.User, { foreignKey: 'user_id' });
//   favorite.belongsTo(models.Product, { foreignKey: 'product_id' });
// };
favorite.belongsTo(User, { foreignKey: 'user_id' });
favorite.belongsTo(Product, { foreignKey: 'product_id' });

review.belongsTo(User, { foreignKey: 'user_id' });
review.belongsTo(Product, { foreignKey: 'product_id' });
review.belongsTo(product_options, { foreignKey: 'option_id' });
review.hasMany(review_image, { foreignKey: 'review_id' });
review_image.belongsTo(review, {
  foreignKey: 'review_id',
  onDelete: 'CASCADE',
});

User.belongsToMany(review, {
  through: review_like,
  foreignKey: 'user_id',
  otherKey: 'review_id',
});

review.belongsToMany(User, {
  through: review_like,
  foreignKey: 'review_id',
  otherKey: 'user_id',
});
review.hasMany(review_like, {
  foreignKey: 'review_id',
  as: 'likes',
  onDelete: 'CASCADE',
});
review_like.belongsTo(review, { foreignKey: 'review_id' });

// 필요한 모델들 export
module.exports = {
  order,
  order_item,
  Product,
  ProductImage,
  product_options,
  point_history,
  Cart,
  User,
  favorite,
  review,
  review_image,
};
