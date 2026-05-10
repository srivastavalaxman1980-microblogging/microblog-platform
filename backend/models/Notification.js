const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    actor_id: { type: DataTypes.UUID, allowNull: true },
    post_id: { type: DataTypes.UUID, allowNull: true },
    comment_id: { type: DataTypes.UUID, allowNull: true },
    content: { type: DataTypes.STRING(500), allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: DataTypes.DATE
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true
  });
  return Notification;
};