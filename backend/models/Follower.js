const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Follower = sequelize.define('Follower', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    follower_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    following_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
      defaultValue: 'accepted'
    }
  }, {
    tableName: 'followers',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['follower_id', 'following_id']
      }
    ]
  });
  
  return Follower;
};