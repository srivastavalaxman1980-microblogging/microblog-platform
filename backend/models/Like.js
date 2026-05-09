const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Like = sequelize.define('Like', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'likes',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'post_id']
      }
    ]
  });
  
  return Like;
};