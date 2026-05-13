const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PostReaction = sequelize.define('PostReaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'posts', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('like', 'laugh', 'shock', 'sad', 'angry'),
      defaultValue: 'like',
    },
  }, {
    tableName: 'post_reactions',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['user_id', 'post_id', 'type'] }],
  });
  return PostReaction;
};