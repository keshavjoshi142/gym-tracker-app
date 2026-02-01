/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Create personal_records table
    knex.schema.createTable('personal_records', function (table) {
      table.string('id').primary();
      table.string('user_id').notNullable();
      table.string('exercise_id').notNullable();
      table.string('record_type', 50).notNullable(); // 'max_weight', 'max_reps', etc.
      table.decimal('value', 8, 2).notNullable();
      table.string('workout_id');
      table.timestamp('achieved_at').notNullable();
      table.timestamps(true, true);
      
      // Foreign keys and constraints
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('exercise_id').references('exercises.id').onDelete('CASCADE');
      table.foreign('workout_id').references('workouts.id').onDelete('SET NULL');
      table.unique(['user_id', 'exercise_id', 'record_type']);
      table.index(['user_id', 'exercise_id']);
    }),
    
    // Create body_measurements table
    knex.schema.createTable('body_measurements', function (table) {
      table.string('id').primary();
      table.string('user_id').notNullable();
      table.date('measurement_date').notNullable();
      table.decimal('weight_kg', 5, 2);
      table.decimal('body_fat_percentage', 4, 2);
      table.decimal('muscle_mass_kg', 5, 2);
      table.jsonb('measurements'); // Store various body measurements
      table.text('notes');
      table.timestamps(true, true);
      
      // Foreign key and index
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.index(['user_id', 'measurement_date']);
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('body_measurements'),
    knex.schema.dropTable('personal_records')
  ]);
};
