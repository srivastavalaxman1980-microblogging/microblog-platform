const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlacklistEntry = sequelize.define('BlacklistEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    keyword: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(20),
      defaultValue: 'custom', // 'profanity', 'nsfw', 'custom'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
  }, {
    tableName: 'blacklist_entries',
    underscored: true,
    timestamps: true,
  });
  return BlacklistEntry;
};