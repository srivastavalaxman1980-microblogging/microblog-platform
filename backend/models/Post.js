const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true, len: [1, 280] }
    },
    media_urls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    visibility: {
      type: DataTypes.STRING,
      defaultValue: 'public'
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shares_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted_at: DataTypes.DATE,
    // Share/retweet fields
    shared_from: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'posts', key: 'id' }
    },
    share_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: { len: [0, 280] }
    }
  }, {
    tableName: 'posts',
    underscored: true,
    timestamps: true
  });
  return Post;
};