'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      full_name: Sequelize.STRING(100),
      bio: Sequelize.TEXT,
      avatar_url: Sequelize.STRING(500),
      cover_photo_url: Sequelize.STRING(500),
      location: Sequelize.STRING(100),
      website: Sequelize.STRING(200),
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login_at: Sequelize.DATE,
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      followers_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      following_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      posts_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Posts table
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      media_urls: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      visibility: {
        type: Sequelize.ENUM('public', 'followers', 'private'),
        defaultValue: 'public'
      },
      likes_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      comments_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      shares_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deleted_at: Sequelize.DATE,
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Followers table
    await queryInterface.createTable('followers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      follower_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      following_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'blocked'),
        defaultValue: 'accepted'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create other tables similarly...
    // For brevity, I'll show the essential ones - you can add the rest
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('followers');
    await queryInterface.dropTable('users');
    // Drop other tables in reverse order
  }
};