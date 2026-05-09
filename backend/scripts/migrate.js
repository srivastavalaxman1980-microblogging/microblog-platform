const { sequelize } = require('../models');
const config = require('../config/config');

async function migrate() {
  try {
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = config[env];
    
    console.log(`🚀 Running database migration in ${env} environment...`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🔌 Host: ${dbConfig.host}:${dbConfig.port}`);
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synced successfully');
    
    // Log table creation
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Created tables:');
    results.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();