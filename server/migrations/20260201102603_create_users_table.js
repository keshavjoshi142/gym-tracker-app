/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function (table) {
    table.string('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.date('date_of_birth');
    table.string('gender', 20);
    table.integer('height_cm');
    table.decimal('weight_kg', 5, 2);
    table.string('activity_level', 20).defaultTo('moderate');
    table.specificType('goals', 'text[]');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login');
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['email']);
    table.index(['username']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
