const bcrypt = require('bcryptjs');
const { sequelize, User, Post, Follower } = require('../models');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('⚠️  Database already has data. Skipping seed.');
      process.exit(0);
    }
    
    // Create demo users
    const now = new Date();
    const users = await User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@microblog.com',
        password_hash: await bcrypt.hash('Admin123!', 10),
        full_name: 'Admin User',
        bio: 'Platform administrator',
        role: 'admin',
        verified: true,
        created_at: now,
        updated_at: now
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: await bcrypt.hash('John123!', 10),
        full_name: 'John Doe',
        bio: 'Software developer and tech enthusiast',
        role: 'user',
        created_at: now,
        updated_at: now
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: await bcrypt.hash('Jane123!', 10),
        full_name: 'Jane Smith',
        bio: 'Digital marketer | Social media expert',
        role: 'user',
        created_at: now,
        updated_at: now
      }
    ]);
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create demo posts
    const posts = await Post.bulkCreate([
      {
        user_id: users[1].id,
        content: 'Welcome to MicroBlog! 🎉 This is our first post. #welcome #microblog',
        visibility: 'public',
        likes_count: 5,
        comments_count: 2,
        created_at: now,
        updated_at: now
      },
      {
        user_id: users[2].id,
        content: 'Just joined this amazing platform! Can\'t wait to connect with everyone. #firstpost',
        visibility: 'public',
        likes_count: 3,
        created_at: now,
        updated_at: now
      },
      {
        user_id: users[0].id,
        content: 'Welcome to the official launch of MicroBlog! Share your thoughts and connect with others.',
        visibility: 'public',
        likes_count: 10,
        comments_count: 3,
        created_at: now,
        updated_at: now
      }
    ]);
    
    console.log(`✅ Created ${posts.length} posts`);
    
    // Create followers
    await Follower.bulkCreate([
      {
        follower_id: users[1].id,
        following_id: users[2].id,
        status: 'accepted',
        created_at: now,
        updated_at: now
      },
      {
        follower_id: users[2].id,
        following_id: users[1].id,
        status: 'accepted',
        created_at: now,
        updated_at: now
      }
    ]);
    
    console.log('✅ Created follower relationships');
    
    // Update counts
    await User.update(
      { posts_count: 1 },
      { where: { id: [users[1].id, users[2].id, users[0].id] } }
    );
    
    await User.update(
      { followers_count: 1, following_count: 1 },
      { where: { id: [users[1].id, users[2].id] } }
    );
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Demo login credentials:');
    console.log('   Admin: admin@microblog.com / Admin123!');
    console.log('   John: john@example.com / John123!');
    console.log('   Jane: jane@example.com / Jane123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();