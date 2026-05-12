const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    media_urls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    visibility: {
      type: DataTypes.STRING,
      defaultValue: 'public',
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comments_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    shares_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shared_from: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    share_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // 🔽 NEW PIN FIELDS 🔽
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pinned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pin_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'posts',
    underscored: true,
    timestamps: true,
  });
  return Post;
};