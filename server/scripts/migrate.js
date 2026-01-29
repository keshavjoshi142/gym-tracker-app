const Database = require('../database/db');

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    const db = new Database();
    await db.initialize();
    
    console.log('✅ Database initialization completed successfully!');
    console.log('📋 Tables created:');
    console.log('  - exercises');
    console.log('  - workouts');
    console.log('  - workout_exercises');
    console.log('  - workout_sets');
    console.log('  - personal_records');
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();