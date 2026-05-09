const { Sequelize } = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log(`🔧 Initializing database connection in ${env} mode...`);

let sequelize;

// Check if using DATABASE_URL (production) or individual parameters
if (dbConfig.url) {
  console.log('📡 Connecting via DATABASE_URL');
  console.log(`📍 Host: ${dbConfig.url.split('@')[1]?.split('/')[0] || 'hidden'}`);
  sequelize = new Sequelize(dbConfig.url, {
    dialect: 'postgres',
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions || {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  console.log('📡 Connecting via individual parameters');
  console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`🗄️  Database: ${dbConfig.database}`);
  console.log(`👤 User: ${dbConfig.username}`);
  
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Test the connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connection established successfully'))
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Check if DATABASE_URL is set correctly in Render environment');
    console.error('   2. Verify the database exists and credentials are correct');
    console.error('   3. Ensure SSL is properly configured for production');
    if (!dbConfig.url) {
      console.error('   4. For production, use DATABASE_URL instead of individual parameters');
    }
  });

// Import all models
const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Comment = require('./Comment')(sequelize);
const Follower = require('./Follower')(sequelize);

// ============ USER ASSOCIATIONS ============
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });

// Follow associations (self-referential many-to-many)
User.belongsToMany(User, {
  as: 'followers',
  through: Follower,
  foreignKey: 'following_id',
  otherKey: 'follower_id'
});

User.belongsToMany(User, {
  as: 'following',
  through: Follower,
  foreignKey: 'follower_id',
  otherKey: 'following_id'
});

// Follower associations
Follower.belongsTo(User, { as: 'follower', foreignKey: 'follower_id' });
Follower.belongsTo(User, { as: 'following', foreignKey: 'following_id' });

// ============ POST ASSOCIATIONS ============
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });

// ============ COMMENT ASSOCIATIONS ============
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'parent' });

// ============ EXPORT MODULES ============
module.exports = {
  sequelize,
  Sequelize,
  User,
  Post,
  Comment,
  Follower
};