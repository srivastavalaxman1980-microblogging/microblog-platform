const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PostView = sequelize.define('PostView', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'posts', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // can be null for unauthenticated views
      references: { model: 'users', key: 'id' },
    },
    viewed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'post_views',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['post_id'] },
      { fields: ['viewed_at'] },
    ],
  });
  return PostView;
};