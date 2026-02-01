/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Create exercises table (base table that exists in original schema)
    knex.schema.createTable('exercises', function (table) {
      table.string('id').primary();
      table.string('name', 255).notNullable();
      table.string('category', 255).notNullable();
      table.jsonb('muscle_groups').notNullable();
      table.text('description');
      table.text('instructions');
      table.string('equipment', 100);
      table.string('difficulty_level', 20).defaultTo('beginner');
      table.boolean('is_custom').defaultTo(false);
      table.boolean('is_public').defaultTo(true);
      table.string('created_by_user_id');
      table.timestamps(true, true);
    }),
    
    // Create workouts table (base table that exists in original schema)
    knex.schema.createTable('workouts', function (table) {
      table.string('id').primary();
      table.string('date', 255).notNullable();
      table.string('name', 255);
      table.integer('duration_minutes');
      table.text('notes');
      table.boolean('is_template').defaultTo(false);
      table.timestamps(true, true);
    }),
    
    // Create workout_exercises table
    knex.schema.createTable('workout_exercises', function (table) {
      table.string('id').primary();
      table.string('workout_id').notNullable();
      table.string('exercise_id').notNullable();
      table.integer('order_index').notNullable();
      table.integer('target_sets');
      table.integer('target_reps');
      table.decimal('target_weight', 6, 2);
      table.integer('rest_time_seconds').defaultTo(60);
      table.text('notes');
      table.timestamps(true, true);
      
      // Foreign keys
      table.foreign('workout_id').references('workouts.id').onDelete('CASCADE');
      table.foreign('exercise_id').references('exercises.id').onDelete('CASCADE');
    }),
    
    // Create workout_sets table
    knex.schema.createTable('workout_sets', function (table) {
      table.string('id').primary();
      table.string('workout_exercise_id').notNullable();
      table.integer('set_number').notNullable();
      table.decimal('weight', 6, 2).notNullable().defaultTo(0);
      table.integer('reps').notNullable().defaultTo(0);
      table.decimal('rpe', 3, 1);
      table.timestamp('completed_at');
      table.text('notes');
      table.timestamps(true, true);
      
      // Foreign key
      table.foreign('workout_exercise_id').references('workout_exercises.id').onDelete('CASCADE');
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('workout_sets'),
    knex.schema.dropTable('workout_exercises'),
    knex.schema.dropTable('workouts'),
    knex.schema.dropTable('exercises')
  ]);
};
