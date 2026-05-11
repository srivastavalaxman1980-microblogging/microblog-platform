const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ModerationLog = sequelize.define('ModerationLog', {
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
    content_type: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    matched_keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., 'discrimination', 'misogyny', 'homophobia', etc.
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    action_taken: {
      type: DataTypes.STRING,
      defaultValue: 'rejected',
    },
  }, {
    tableName: 'moderation_logs',
    underscored: true,
    timestamps: true,
  });
  return ModerationLog;
};