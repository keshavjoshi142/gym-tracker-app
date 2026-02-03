/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_custom_exercises', (table) => {
    table.string('id').primary();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('exercise_id').references('id').inTable('exercises').onDelete('CASCADE').notNullable();
    table.timestamps(true, true);

    // Ensure a user can only favorite an exercise once
    table.unique(['user_id', 'exercise_id']);
    
    // Add indexes for better performance
    table.index(['user_id']);
    table.index(['exercise_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_custom_exercises');
};
