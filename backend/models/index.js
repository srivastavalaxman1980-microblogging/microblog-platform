const { Sequelize } = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];


console.log(`🔧 Initializing database connection in ${env} mode...`);

let sequelize;
if (dbConfig.url) {
  console.log('📡 Connecting via DATABASE_URL');
  sequelize = new Sequelize(dbConfig.url, {
    dialect: 'postgres',
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
  });
} else {
  console.log('📡 Connecting via individual parameters');
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
      pool: dbConfig.pool,
    }
  );
}

// ========== IMPORT MODELS (EACH ONCE) ==========
const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Comment = require('./Comment')(sequelize);
const Follower = require('./Follower')(sequelize);
const Message = require('./Message')(sequelize);
const Conversation = require('./Conversation')(sequelize);
const Group = require('./Group')(sequelize);
const GroupMember = require('./GroupMember')(sequelize);
const Ad = require('./Ad')(sequelize);
const Analytics = require('./Analytics')(sequelize);
const Report = require('./Report')(sequelize);
const Hashtag = require('./Hashtag')(sequelize);
const PostHashtag = require('./PostHashtag')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const ApiKey = require('./ApiKey')(sequelize);
const Notification = require('./Notification')(sequelize);
const Like = require('./Like')(sequelize);
const ModerationLog = require('./ModerationLog')(sequelize);
const UserBlock = require('./UserBlock')(sequelize);
const UserMutedKeyword = require('./UserMutedKeyword')(sequelize);
const PostView = require('./PostView')(sequelize);
const FollowerHistory = require('./FollowerHistory')(sequelize);
const BlacklistEntry = require('./BlacklistEntry')(sequelize);

// ========== ASSOCIATIONS ==========

// ---- User ----
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
User.hasMany(Like, { foreignKey: 'user_id', as: 'likes' });
User.hasMany(Follower, { as: 'followers', foreignKey: 'following_id' });
User.hasMany(Follower, { as: 'following', foreignKey: 'follower_id' });
User.hasMany(Message, { as: 'sent_messages', foreignKey: 'sender_id' });
User.hasMany(Message, { as: 'received_messages', foreignKey: 'receiver_id' });
User.hasMany(GroupMember, { as: 'group_memberships', foreignKey: 'user_id' });
User.hasMany(ApiKey, { as: 'api_keys', foreignKey: 'user_id' });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'user_id' });
User.hasMany(Report, { as: 'reports_made', foreignKey: 'reported_by' });
User.hasMany(Report, { as: 'reports_resolved', foreignKey: 'resolved_by' });
User.hasMany(UserBlock, { as: 'blocks', foreignKey: 'blocker_id' });
User.hasMany(UserBlock, { as: 'blockedBy', foreignKey: 'blocked_id' });
User.hasMany(UserMutedKeyword, { as: 'mutedKeywords', foreignKey: 'user_id' });
User.hasMany(FollowerHistory, { foreignKey: 'user_id', as: 'followerHistory' });

// ---- Post ----
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Post.hasMany(Like, { foreignKey: 'post_id', as: 'likes' });
Post.belongsToMany(Hashtag, { through: PostHashtag, as: 'hashtags' });
Post.belongsTo(Post, { as: 'original', foreignKey: 'shared_from' });
Post.hasMany(Post, { as: 'shares', foreignKey: 'shared_from' });
Post.hasMany(PostView, { foreignKey: 'post_id', as: 'views' });
PostView.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });


// ---- Comment ----
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'parent' });

// ---- Follower ----
Follower.belongsTo(User, { as: 'follower', foreignKey: 'follower_id' });
Follower.belongsTo(User, { as: 'following', foreignKey: 'following_id' });

// ---- Message & Conversation ----
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// ---- Group ----
Group.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });
Group.hasMany(GroupMember, { as: 'members', foreignKey: 'group_id' });
Group.belongsToMany(User, { through: GroupMember, as: 'users' });
GroupMember.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
GroupMember.belongsTo(Group, { as: 'group', foreignKey: 'group_id' });

// ---- Hashtag ----
Hashtag.belongsToMany(Post, { through: PostHashtag, as: 'posts' });

// ---- Like ----
Like.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Like.belongsTo(Post, { as: 'post', foreignKey: 'post_id' });

// ---- ApiKey ----
ApiKey.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// ---- Notification ----
Notification.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Notification.belongsTo(User, { as: 'actor', foreignKey: 'actor_id' });
Notification.belongsTo(Post, { as: 'post', foreignKey: 'post_id' });

// ---- Report ----
Report.belongsTo(User, { as: 'reporter', foreignKey: 'reported_by' });
Report.belongsTo(User, { as: 'resolver', foreignKey: 'resolved_by' });
Report.belongsTo(Post, { as: 'post', foreignKey: 'post_id' });

// ---- ModerationLog ----
ModerationLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ModerationLog.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// ---- UserBlock ----
UserBlock.belongsTo(User, { as: 'blocker', foreignKey: 'blocker_id' });
UserBlock.belongsTo(User, { as: 'blocked', foreignKey: 'blocked_id' });

// ---- UserMutedKeyword ----
UserMutedKeyword.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Post,
  Comment,
  Follower,
  Message,
  Conversation,
  Group,
  GroupMember,
  Ad,
  Analytics,
  Report,
  Hashtag,
  PostHashtag,
  AuditLog,
  ApiKey,
  Notification,
  Like,
  ModerationLog,
  UserBlock,
  UserMutedKeyword,
  PostView,
  FollowerHistory,
  BlacklistEntry,
};