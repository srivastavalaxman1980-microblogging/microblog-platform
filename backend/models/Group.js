const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    cover_photo_url: DataTypes.STRING(500),
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    member_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    post_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'groups',
    underscored: true,
    timestamps: true
  });
  
  return Group;
};