const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reported_by: {
      type: DataTypes.UUID,
      allowNull: false
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    comment_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'resolved', 'dismissed'),
      defaultValue: 'pending'
    },
    resolved_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    resolution_note: {
      type: DataTypes.TEXT
    },
    resolved_at: DataTypes.DATE
  }, {
    tableName: 'reports',
    underscored: true,
    timestamps: true
  });
  
  return Report;
};