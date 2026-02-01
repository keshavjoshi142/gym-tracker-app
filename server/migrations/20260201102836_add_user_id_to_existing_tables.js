/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // First check if workouts table exists
  const workoutsExists = await knex.schema.hasTable('workouts');
  
  if (workoutsExists) {
    // Check if user_id column already exists
    const hasUserIdColumn = await knex.schema.hasColumn('workouts', 'user_id');
    
    if (!hasUserIdColumn) {
      // Create a default user for existing data
      const defaultUserId = 'default-user-' + Date.now();
      
      await knex('users').insert({
        id: defaultUserId,
        username: 'gymtracker_user',
        email: 'user@gymtracker.com',
        password_hash: await require('bcrypt').hash('temppassword123', 12),
        first_name: 'GymTracker User',
        is_active: true,
        email_verified: true
      }).onConflict('email').ignore();
      
      // Add user_id column to workouts
      await knex.schema.table('workouts', function(table) {
        table.string('user_id');
      });
      
      // Update existing workouts to reference default user
      await knex('workouts').update({ user_id: defaultUserId }).whereNull('user_id');
      
      // Make user_id required and add foreign key
      await knex.schema.table('workouts', function(table) {
        table.string('user_id').notNullable().alter();
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.index(['user_id', 'date']);
      });
      
      console.log('✅ Added user_id to workouts table');
      console.log('📧 Default user created: user@gymtracker.com');
      console.log('🔑 Temporary password: temppassword123');
    }
  }
  
  // Handle exercises table
  const exercisesExists = await knex.schema.hasTable('exercises');
  
  if (exercisesExists) {
    const hasCreatedByColumn = await knex.schema.hasColumn('exercises', 'created_by_user_id');
    
    if (!hasCreatedByColumn) {
      await knex.schema.table('exercises', function(table) {
        table.string('created_by_user_id');
        table.boolean('is_custom').defaultTo(false);
        table.boolean('is_public').defaultTo(true);
      });
      
      // Add foreign key constraint
      await knex.schema.table('exercises', function(table) {
        table.foreign('created_by_user_id').references('users.id').onDelete('SET NULL');
      });
      
      console.log('✅ Added user fields to exercises table');
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Remove foreign keys and columns
  const workoutsExists = await knex.schema.hasTable('workouts');
  if (workoutsExists) {
    await knex.schema.table('workouts', function(table) {
      table.dropForeign(['user_id']);
      table.dropColumn('user_id');
    });
  }
  
  const exercisesExists = await knex.schema.hasTable('exercises');
  if (exercisesExists) {
    await knex.schema.table('exercises', function(table) {
      table.dropForeign(['created_by_user_id']);
      table.dropColumn('created_by_user_id');
      table.dropColumn('is_custom');
      table.dropColumn('is_public');
    });
  }
};
