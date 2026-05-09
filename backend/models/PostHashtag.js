const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PostHashtag = sequelize.define('PostHashtag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    hashtag_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'post_hashtags',
    underscored: true,
    timestamps: true
  });
  
  return PostHashtag;
};