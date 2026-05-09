const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ad = sequelize.define('Ad', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    media_url: DataTypes.STRING(500),
    target_url: DataTypes.STRING(500),
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    spent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    impressions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    targeting: {
      type: DataTypes.JSONB,
      defaultValue: {
        age_range: null,
        location: null,
        interests: []
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'paused', 'ended', 'rejected'),
      defaultValue: 'pending'
    },
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE
  }, {
    tableName: 'ads',
    underscored: true,
    timestamps: true
  });
  
  return Ad;
};