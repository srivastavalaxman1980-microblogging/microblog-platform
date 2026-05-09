const { Sequelize } = require('sequelize');
const config = require('../config/db')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    dialectOptions: config.dialectOptions
  }
);

// Import all models
const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Comment = require('./Comment')(sequelize);
const Follower = require('./Follower')(sequelize);

// ============ USER ASSOCIATIONS ============
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });

// Follow associations
User.belongsToMany(User, {
  as: 'followers',
  through: Follower,
  foreignKey: 'following_id',
  otherKey: 'follower_id'
});
User.belongsToMany(User, {
  as: 'following',
  through: Follower,
  foreignKey: 'follower_id',
  otherKey: 'following_id'
});

// Follower associations
Follower.belongsTo(User, { as: 'follower', foreignKey: 'follower_id' });
Follower.belongsTo(User, { as: 'following', foreignKey: 'following_id' });

// ============ POST ASSOCIATIONS ============
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });

// ============ COMMENT ASSOCIATIONS ============
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'parent' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Post,
  Comment,
  Follower
};