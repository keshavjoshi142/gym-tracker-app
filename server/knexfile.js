// Knex.js configuration file
require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/gymtracker_dev';

console.log(`🔍 Knex environment: ${environment}`);
console.log(`🔗 Database connection: ${connectionString}`);

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      connectionString: connectionString,
      ssl: false
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};