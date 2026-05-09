const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApiKey = sequelize.define('ApiKey', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    key_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    key_preview: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['read']
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_used_at: DataTypes.DATE,
    expires_at: DataTypes.DATE
  }, {
    tableName: 'api_keys',
    underscored: true,
    timestamps: true
  });
  
  return ApiKey;
};