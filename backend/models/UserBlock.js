const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserBlock = sequelize.define('UserBlock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blocker_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    blocked_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('block', 'mute'),
      defaultValue: 'block',
    },
  }, {
    tableName: 'user_blocks',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['blocker_id', 'blocked_id', 'type'] }],
  });
  return UserBlock;
};