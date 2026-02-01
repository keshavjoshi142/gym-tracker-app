// Knex.js configuration file
require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost/gymtracker_dev',
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
      connectionString: process.env.DATABASE_URL,
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