const { sequelize } = require('../models');

async function migrate() {
  try {
    const env = process.env.NODE_ENV || 'development';
    const dbName = process.env.DB_NAME || 'microblogging_dev';
    const dbHost = process.env.DB_HOST || 'localhost';
    
    console.log(`🚀 Running database migration in ${env} environment...`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`🔌 Host: ${dbHost}:${process.env.DB_PORT || 5432}`);
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synced successfully');
    
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📝 Troubleshooting tips:');
    console.error('   1. Make sure the database exists on Render');
    console.error('   2. Check your environment variables in Render dashboard');
    console.error('   3. Verify the database name is exactly "microblogging_dev"');
    process.exit(1);
  }
}

migrate();