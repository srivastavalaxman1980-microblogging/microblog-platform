const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserMutedKeyword = sequelize.define('UserMutedKeyword', {
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
    keyword: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  }, {
    tableName: 'user_muted_keywords',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['user_id', 'keyword'] }],
  });
  return UserMutedKeyword;
};