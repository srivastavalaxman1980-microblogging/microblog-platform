const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_deleted_for_sender: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_deleted_for_receiver: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'messages',
    underscored: true,
    timestamps: true
  });
  
  return Message;
};