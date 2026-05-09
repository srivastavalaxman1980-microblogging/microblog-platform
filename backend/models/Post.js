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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 280]
      }
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'posts',
    underscored: true,
    timestamps: true,     // Enables created_at and updated_at
    createdAt: 'created_at',  // Explicitly map to correct column
    updatedAt: 'updated_at'   // Explicitly map to correct column
  });
  
  return Post;
};