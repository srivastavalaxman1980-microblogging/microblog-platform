const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isAlphanumeric: true,
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 160]
      }
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cover_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      defaultValue: 'user'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login_at: DataTypes.DATE,
    followers_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    following_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    posts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          in_app: true
        },
        privacy: {
          profile_visible: 'public',
          allow_messages: 'everyone'
        }
      }
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true
  });
  
  User.prototype.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };
  
  return User;
};