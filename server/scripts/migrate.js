const Database = require('../database/db');
const UserMigration = require('./migrate-add-users');

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    // First, run the user authentication migration for existing data
    console.log('📋 Step 1: User authentication migration...');
    const userMigration = new UserMigration();
    await userMigration.runMigration();
    
    // Then, run the standard database initialization for any missing tables
    console.log('📋 Step 2: Standard database initialization...');
    const db = new Database();
    await db.initialize();
    
    console.log('✅ All migrations completed successfully!');
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();