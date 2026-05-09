const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Analytics = sequelize.define('Analytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ad_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ip_address: DataTypes.STRING(45),
    user_agent: DataTypes.TEXT,
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'analytics',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        fields: ['action_type', 'timestamp']
      },
      {
        fields: ['user_id', 'timestamp']
      }
    ]
  });
  
  return Analytics;
};