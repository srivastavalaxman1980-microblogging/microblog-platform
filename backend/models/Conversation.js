const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // participants stored as array of user IDs (or via junction table – simpler as array)
    participants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
    },
    last_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'conversations',
    underscored: true,
    timestamps: true,
  });
  return Conversation;
};