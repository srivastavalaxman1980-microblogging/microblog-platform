const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FollowerHistory = sequelize.define('FollowerHistory', {
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
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'follower_history',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['recorded_at'] },
    ],
  });
  return FollowerHistory;
};