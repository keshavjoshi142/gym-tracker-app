const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class UserMigration {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async runMigration() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('🚀 Starting user authentication migration...');

      // Step 1: Create users table
      console.log('1️⃣ Creating users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          date_of_birth DATE,
          gender VARCHAR(20),
          height_cm INTEGER,
          weight_kg DECIMAL(5,2),
          activity_level VARCHAR(20) DEFAULT 'moderate',
          goals TEXT[],
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Step 2: Create user_sessions table
      console.log('2️⃣ Creating user_sessions table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Step 3: Check if we need to create a default user for existing data
      const existingDataCheck = await client.query('SELECT COUNT(*) as count FROM workouts');
      const hasExistingData = parseInt(existingDataCheck.rows[0].count) > 0;
      
      let defaultUserId = null;
      if (hasExistingData) {
        console.log('3️⃣ Found existing workout data, creating default user...');
        
        defaultUserId = uuidv4();
        const defaultPassword = await bcrypt.hash('temppassword123', 12);
        
        await client.query(`
          INSERT INTO users (
            id, username, email, password_hash, first_name, is_active, email_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (email) DO NOTHING
        `, [
          defaultUserId,
          'gymtracker_user',
          'user@gymtracker.com',
          defaultPassword,
          'GymTracker User',
          true,
          true
        ]);

        console.log(`📝 Created default user: user@gymtracker.com (temp password: temppassword123)`);
      }

      // Step 4: Add user_id columns to existing tables if they don't exist
      console.log('4️⃣ Adding user_id columns to existing tables...');
      
      // Check and add user_id to workouts table
      const workoutsColumns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'user_id'
      `);
      
      if (workoutsColumns.rows.length === 0) {
        console.log('  📝 Adding user_id to workouts table...');
        await client.query('ALTER TABLE workouts ADD COLUMN user_id VARCHAR(255)');
        
        if (hasExistingData && defaultUserId) {
          await client.query('UPDATE workouts SET user_id = $1 WHERE user_id IS NULL', [defaultUserId]);
        }
        
        await client.query('ALTER TABLE workouts ALTER COLUMN user_id SET NOT NULL');
        await client.query('ALTER TABLE workouts ADD CONSTRAINT fk_workouts_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
      }

      // Check and add created_by_user_id to exercises table  
      const exercisesColumns = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'exercises' AND column_name = 'created_by_user_id'
      `);
      
      if (exercisesColumns.rows.length === 0) {
        console.log('  📝 Adding created_by_user_id to exercises table...');
        await client.query('ALTER TABLE exercises ADD COLUMN created_by_user_id VARCHAR(255)');
        await client.query('ALTER TABLE exercises ADD COLUMN is_custom BOOLEAN DEFAULT false');
        await client.query('ALTER TABLE exercises ADD COLUMN is_public BOOLEAN DEFAULT true');
        
        if (hasExistingData && defaultUserId) {
          await client.query('UPDATE exercises SET created_by_user_id = $1 WHERE created_by_user_id IS NULL', [defaultUserId]);
        }
        
        await client.query('ALTER TABLE exercises ADD CONSTRAINT fk_exercises_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL');
      }

      // Step 5: Create new tables that depend on users
      console.log('5️⃣ Creating new user-dependent tables...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS personal_records (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          exercise_id VARCHAR(255) NOT NULL,
          record_type VARCHAR(50) NOT NULL,
          value DECIMAL(8,2) NOT NULL,
          workout_id VARCHAR(255),
          achieved_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
          FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE SET NULL,
          UNIQUE(user_id, exercise_id, record_type)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS body_measurements (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          measurement_date DATE NOT NULL,
          weight_kg DECIMAL(5,2),
          body_fat_percentage DECIMAL(4,2),
          muscle_mass_kg DECIMAL(5,2),
          measurements JSONB,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Step 6: Create indexes
      console.log('6️⃣ Creating performance indexes...');
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)',
        'CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)',
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at)',
        'CREATE INDEX IF NOT EXISTS idx_workouts_user_id_date ON workouts (user_id, date)',
        'CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises (workout_id)',
        'CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_exercise_id ON workout_sets (workout_exercise_id)',
        'CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON personal_records (user_id, exercise_id)',
        'CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements (user_id, measurement_date)'
      ];

      for (const indexQuery of indexes) {
        try {
          await client.query(indexQuery);
        } catch (indexError) {
          console.warn(`⚠️ Index creation warning: ${indexError.message}`);
        }
      }

      await client.query('COMMIT');
      
      console.log('✅ User authentication migration completed successfully!');
      
      if (hasExistingData) {
        console.log('\n🔐 IMPORTANT SECURITY NOTICE:');
        console.log('📧 Default user created: user@gymtracker.com');
        console.log('🔑 Temporary password: temppassword123');
        console.log('⚠️  Please change this password immediately after login!');
        console.log('📊 All existing workout data has been assigned to this default user.');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      client.release();
      await this.pool.end();
    }
  }
}

async function runMigration() {
  const migration = new UserMigration();
  await migration.runMigration();
}

if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = UserMigration;