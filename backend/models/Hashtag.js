const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Hashtag = sequelize.define('Hashtag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tag: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    post_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    trending_score: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    last_trending_update: DataTypes.DATE
  }, {
    tableName: 'hashtags',
    underscored: true,
    timestamps: true
  });
  return Hashtag;
};