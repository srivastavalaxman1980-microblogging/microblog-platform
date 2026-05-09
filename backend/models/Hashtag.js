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
    }
  }, {
    tableName: 'hashtags',
    underscored: true,
    timestamps: true
  });
  
  return Hashtag;
};