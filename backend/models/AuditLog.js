const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    old_values: {
      type: DataTypes.JSONB
    },
    new_values: {
      type: DataTypes.JSONB
    },
    ip_address: DataTypes.STRING(45),
    user_agent: DataTypes.TEXT
  }, {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });
  
  return AuditLog;
};