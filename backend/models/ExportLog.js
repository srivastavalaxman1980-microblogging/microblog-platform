const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExportLog = sequelize.define('ExportLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    type: { type: DataTypes.STRING, allowNull: false }, // 'export', 'import', 'backup'
    status: { type: DataTypes.STRING, defaultValue: 'success' },
    details: { type: DataTypes.JSONB, allowNull: true },
  }, {
    tableName: 'export_logs',
    underscored: true,
    timestamps: true,
  });
  return ExportLog;
};