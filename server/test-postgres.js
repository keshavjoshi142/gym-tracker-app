// Test PostgreSQL connection
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';
  
require('dotenv').config({ path: path.join(__dirname, envFile) });
console.log(`📂 Loading environment from: ${envFile}`);

const { Pool } = require('pg');

// Test connection with environment variables
async function testConnection() {
  try {
    console.log('🔄 Testing PostgreSQL connection...');
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
      return;
    }
    
    console.log('🔗 Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current database time:', result.rows[0].current_time);
    
    // Test database creation (if needed)
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      INSERT INTO connection_test (test_message) 
      VALUES ('PostgreSQL connection successful!')
    `);
    
    const testResult = await client.query('SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1');
    console.log('📝 Test record:', testResult.rows[0]);
    
    // Clean up test table
    await client.query('DROP TABLE connection_test');
    console.log('🧹 Cleaned up test table');
    
    client.release();
    await pool.end();
    
    console.log('🎉 PostgreSQL connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
  }
}

testConnection();