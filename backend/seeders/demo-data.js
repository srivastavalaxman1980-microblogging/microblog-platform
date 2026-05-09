const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Create users
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'admin',
        email: 'admin@microblog.com',
        password_hash: await bcrypt.hash('Admin123!', 10),
        full_name: 'Admin User',
        role: 'admin',
        verified: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: await bcrypt.hash('John123!', 10),
        full_name: 'John Doe',
        bio: 'Software developer and tech enthusiast',
        created_at: now,
        updated_at: now
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: await bcrypt.hash('Jane123!', 10),
        full_name: 'Jane Smith',
        bio: 'Digital marketer | Social media expert',
        created_at: now,
        updated_at: now
      }
    ];
    
    await queryInterface.bulkInsert('users', users);
    
    // Create posts
    const posts = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: users[1].id,
        content: 'Welcome to MicroBlog! 🎉 This is our first post. #welcome #microblog',
        visibility: 'public',
        likes_count: 5,
        comments_count: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        user_id: users[2].id,
        content: 'Just joined this amazing platform! Can\'t wait to connect with everyone. #firstpost #hello',
        visibility: 'public',
        likes_count: 3,
        created_at: now,
        updated_at: now
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        user_id: users[0].id,
        content: 'Admin announcement: Welcome to the official launch of MicroBlog! Share your thoughts and connect with others. #announcement #launch',
        visibility: 'public',
        likes_count: 10,
        comments_count: 3,
        created_at: now,
        updated_at: now
      }
    ];
    
    await queryInterface.bulkInsert('posts', posts);
    
    // Create followers
    await queryInterface.bulkInsert('followers', [
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        follower_id: users[1].id,
        following_id: users[2].id,
        status: 'accepted',
        created_at: now,
        updated_at: now
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        follower_id: users[2].id,
        following_id: users[1].id,
        status: 'accepted',
        created_at: now,
        updated_at: now
      }
    ]);
    
    // Create hashtags
    const hashtags = [
      { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', tag: 'welcome', created_at: now, updated_at: now },
      { id: 'gggggggg-gggg-gggg-gggg-gggggggggggg', tag: 'microblog', created_at: now, updated_at: now },
      { id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', tag: 'firstpost', created_at: now, updated_at: now },
      { id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', tag: 'hello', created_at: now, updated_at: now }
    ];
    
    await queryInterface.bulkInsert('hashtags', hashtags);
    
    // Create post_hashtags
    await queryInterface.bulkInsert('post_hashtags', [
      { post_id: posts[0].id, hashtag_id: hashtags[0].id, created_at: now, updated_at: now },
      { post_id: posts[0].id, hashtag_id: hashtags[1].id, created_at: now, updated_at: now },
      { post_id: posts[1].id, hashtag_id: hashtags[2].id, created_at: now, updated_at: now },
      { post_id: posts[1].id, hashtag_id: hashtags[3].id, created_at: now, updated_at: now }
    ]);
    
    // Create group
    const groupId = 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj';
    await queryInterface.bulkInsert('groups', [
      {
        id: groupId,
        name: 'Tech Enthusiasts',
        description: 'Discuss the latest in technology and programming',
        owner_id: users[1].id,
        member_count: 2,
        created_at: now,
        updated_at: now
      }
    ]);
    
    await queryInterface.bulkInsert('group_members', [
      {
        id: 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk',
        group_id: groupId,
        user_id: users[1].id,
        role: 'admin',
        created_at: now,
        updated_at: now
      },
      {
        id: 'llllllll-llll-llll-llll-llllllllllll',
        group_id: groupId,
        user_id: users[2].id,
        role: 'member',
        created_at: now,
        updated_at: now
      }
    ]);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('posts', null, {});
    await queryInterface.bulkDelete('followers', null, {});
    await queryInterface.bulkDelete('hashtags', null, {});
    await queryInterface.bulkDelete('groups', null, {});
  }
};