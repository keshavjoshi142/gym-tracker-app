const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';
  
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    // PostgreSQL connection configuration
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/gymtracker',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool events
    this.pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }

  async initialize() {
    const client = await this.pool.connect();
    
    try {
      // This is now a safe initialization that won't conflict with migrations
      console.log('🔍 Checking database schema...');
      
      // Only create tables if they don't exist (migration-safe)
      await this.ensureTablesExist(client);
      
      // Seed default exercises if the table is empty
      await this.seedDefaultExercises();
      console.log('✅ Database initialization check completed');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureTablesExist(client) {
    // Create exercises table if it doesn't exist (backward compatible)
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        muscle_groups JSONB NOT NULL,
        description TEXT,
        instructions TEXT,
        equipment VARCHAR(100),
        difficulty_level VARCHAR(20) DEFAULT 'beginner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workouts table if it doesn't exist (backward compatible)
    await client.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id VARCHAR(255) PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        duration_minutes INTEGER,
        notes TEXT,
        is_template BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workout_exercises table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS workout_exercises (
        id VARCHAR(255) PRIMARY KEY,
        workout_id VARCHAR(255) NOT NULL,
        exercise_id VARCHAR(255) NOT NULL,
        order_index INTEGER NOT NULL,
        target_sets INTEGER,
        target_reps INTEGER,
        target_weight DECIMAL(6,2),
        rest_time_seconds INTEGER DEFAULT 60,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
      )
    `);

    // Create workout_sets table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS workout_sets (
        id VARCHAR(255) PRIMARY KEY,
        workout_exercise_id VARCHAR(255) NOT NULL,
        set_number INTEGER NOT NULL,
        weight DECIMAL(6,2) NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL DEFAULT 0,
        rpe DECIMAL(3,1),
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Core tables verified/created');
  }

  async seedDefaultExercises() {
    const defaultExercises = [
      {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'Chest',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        description: 'Classic chest exercise using a barbell',
        instructions: 'Lie on bench, grip barbell slightly wider than shoulders, lower to chest, press up',
        equipment: 'Barbell, Bench',
        difficulty_level: 'intermediate'
      },
      {
        id: 'squat',
        name: 'Squat',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        description: 'Fundamental lower body exercise',
        instructions: 'Stand with feet hip-width apart, lower body as if sitting back, return to standing',
        equipment: 'Barbell, Squat Rack',
        difficulty_level: 'beginner'
      },
      {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'Back',
        muscleGroups: ['Back', 'Hamstrings', 'Glutes'],
        description: 'Full body compound movement',
        instructions: 'Stand with feet hip-width apart, bend at hips and knees, lift bar off ground',
        equipment: 'Barbell',
        difficulty_level: 'intermediate'
      },
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        category: 'Shoulders',
        muscleGroups: ['Shoulders', 'Triceps', 'Core'],
        description: 'Standing shoulder press movement',
        instructions: 'Press barbell from shoulders directly overhead, lower with control',
        equipment: 'Barbell',
        difficulty_level: 'intermediate'
      },
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        category: 'Back',
        muscleGroups: ['Back', 'Biceps'],
        description: 'Bodyweight upper body pulling exercise',
        instructions: 'Hang from bar with overhand grip, pull body up until chin clears bar',
        equipment: 'Pull-up Bar',
        difficulty_level: 'intermediate'
      },
      {
        id: 'push-ups',
        name: 'Push-ups',
        category: 'Chest',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        description: 'Classic bodyweight chest exercise',
        instructions: 'Start in plank position, lower body to ground, push back up',
        equipment: 'None',
        difficulty_level: 'beginner'
      }
    ];

    for (const exercise of defaultExercises) {
      await this.createDefaultExercise(exercise);
    }
  }

  async createDefaultExercise(exercise) {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO exercises (id, name, category, muscle_groups, description, instructions, equipment, difficulty_level, is_custom, is_public) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT (id) DO NOTHING`,
        [
          exercise.id, 
          exercise.name, 
          exercise.category, 
          JSON.stringify(exercise.muscleGroups), 
          exercise.description || '', 
          exercise.instructions || '',
          exercise.equipment || '',
          exercise.difficulty_level || 'beginner',
          false, // is_custom
          true   // is_public
        ]
      );
    } finally {
      client.release();
    }
  }

  // ========================================
  // USER AUTHENTICATION METHODS
  // ========================================

  async registerUser(userData) {
    const client = await this.pool.connect();
    try {
      const { username, email, password, firstName, lastName, profile } = userData;
      
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const saltRounds = 12; // Industry standard for production
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const userId = uuidv4();
      const now = new Date().toISOString();

      // Insert user
      const result = await client.query(`
        INSERT INTO users (
          id, username, email, password_hash, first_name, last_name,
          date_of_birth, gender, height_cm, weight_kg, activity_level, goals,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, username, email, first_name, last_name, created_at
      `, [
        userId, username, email, passwordHash, firstName || null, lastName || null,
        profile?.dateOfBirth || null, profile?.gender || null, 
        profile?.height || null, profile?.weight || null,
        profile?.activityLevel || 'moderate', 
        profile?.goals ? JSON.stringify(profile.goals) : null,
        now, now
      ]);

      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        createdAt: result.rows[0].created_at
      };
    } finally {
      client.release();
    }
  }

  async loginUser(identifier, password) {
    const client = await this.pool.connect();
    try {
      // Find user by email or username
      const result = await client.query(`
        SELECT id, username, email, password_hash, first_name, last_name, is_active
        FROM users 
        WHERE (email = $1 OR username = $1) AND is_active = true
      `, [identifier]);

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await client.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          email: user.email 
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '7d' }
      );

      // Store session
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const tokenHash = await bcrypt.hash(token, 10);

      await client.query(`
        INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
      `, [sessionId, user.id, tokenHash, expiresAt]);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      };
    } finally {
      client.release();
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
      
      const client = await this.pool.connect();
      try {
        // Check if user is still active
        const result = await client.query(`
          SELECT id, username, email, first_name, last_name, is_active
          FROM users 
          WHERE id = $1 AND is_active = true
        `, [decoded.userId]);

        if (result.rows.length === 0) {
          throw new Error('User not found or inactive');
        }

        return {
          userId: result.rows[0].id,
          username: result.rows[0].username,
          email: result.rows[0].email,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name
        };
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async logoutUser(userId, token) {
    const client = await this.pool.connect();
    try {
      // Remove session
      const tokenHash = await bcrypt.hash(token, 10);
      await client.query(
        'DELETE FROM user_sessions WHERE user_id = $1 AND token_hash = $2',
        [userId, tokenHash]
      );
      
      return { success: true };
    } finally {
      client.release();
    }
  }

  async getUserProfile(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, username, email, first_name, last_name, date_of_birth,
               gender, height_cm, weight_kg, activity_level, goals, created_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profile: {
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          height: user.height_cm,
          weight: user.weight_kg,
          activityLevel: user.activity_level,
          goals: user.goals ? JSON.parse(user.goals) : []
        },
        createdAt: user.created_at
      };
    } finally {
      client.release();
    }
  }

  async updateUserProfile(userId, updateData) {
    const client = await this.pool.connect();
    try {
      const { firstName, lastName, profile, email } = updateData;
      
      await client.query(`
        UPDATE users SET 
          first_name = $1, last_name = $2, email = $3,
          date_of_birth = $4, gender = $5, height_cm = $6, 
          weight_kg = $7, activity_level = $8, goals = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
      `, [
        firstName, lastName, email,
        profile?.dateOfBirth, profile?.gender, profile?.height,
        profile?.weight, profile?.activityLevel,
        profile?.goals ? JSON.stringify(profile.goals) : null,
        userId
      ]);

      return await this.getUserProfile(userId);
    } finally {
      client.release();
    }
  }

  // ========================================
  // EXERCISE METHODS (User-aware)
  // ========================================

  async getAllExercises(userId = null) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT e.*, 
               CASE WHEN uce.user_id IS NOT NULL THEN true ELSE false END as is_favorited
        FROM exercises e
        LEFT JOIN user_custom_exercises uce ON e.id = uce.exercise_id AND uce.user_id = $1
        WHERE e.is_public = true OR e.created_by_user_id = $1
        ORDER BY e.name
      `;
      
      const result = await client.query(query, [userId]);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        muscleGroups: row.muscle_groups,
        description: row.description,
        instructions: row.instructions,
        equipment: row.equipment,
        difficultyLevel: row.difficulty_level,
        isCustom: row.is_custom,
        isFavorited: row.is_favorited,
        createdByUserId: row.created_by_user_id
      }));
    } finally {
      client.release();
    }
  }

  async createCustomExercise(userId, exercise) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const exerciseId = uuidv4();
      
      // Create the exercise
      await client.query(`
        INSERT INTO exercises (
          id, name, category, muscle_groups, description, instructions,
          equipment, difficulty_level, is_custom, created_by_user_id, is_public
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        exerciseId, exercise.name, exercise.category,
        JSON.stringify(exercise.muscleGroups), exercise.description || '',
        exercise.instructions || '', exercise.equipment || '',
        exercise.difficultyLevel || 'beginner', true, userId,
        exercise.isPublic || false
      ]);

      // Add to user's custom exercises if they want it private
      if (!exercise.isPublic) {
        await client.query(`
          INSERT INTO user_custom_exercises (id, user_id, exercise_id)
          VALUES ($1, $2, $3)
        `, [uuidv4(), userId, exerciseId]);
      }

      await client.query('COMMIT');
      
      return { id: exerciseId, ...exercise, createdByUserId: userId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async favoriteExercise(userId, exerciseId) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO user_custom_exercises (id, user_id, exercise_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, exercise_id) DO NOTHING
      `, [uuidv4(), userId, exerciseId]);
      
      return { success: true };
    } finally {
      client.release();
    }
  }

  async unfavoriteExercise(userId, exerciseId) {
    const client = await this.pool.connect();
    try {
      await client.query(
        'DELETE FROM user_custom_exercises WHERE user_id = $1 AND exercise_id = $2',
        [userId, exerciseId]
      );
      
      return { success: true };
    } finally {
      client.release();
    }
  }

  // ========================================
  // WORKOUT METHODS (User-specific)
  // ========================================

  async getAllWorkouts(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          w.*,
          we.id as we_id, we.exercise_id, we.order_index, we.target_sets, we.target_reps, we.target_weight,
          e.name as exercise_name, e.category, e.muscle_groups,
          ws.id as set_id, ws.set_number, ws.weight, ws.reps, ws.rpe, ws.completed_at, ws.notes as set_notes
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        LEFT JOIN exercises e ON we.exercise_id = e.id
        LEFT JOIN workout_sets ws ON we.id = ws.workout_exercise_id
        WHERE w.user_id = $1
        ORDER BY w.date DESC, we.order_index, ws.set_number
      `, [userId]);

      const workoutsMap = new Map();

      result.rows.forEach(row => {
        if (!workoutsMap.has(row.id)) {
          workoutsMap.set(row.id, {
            id: row.id,
            userId: row.user_id,
            date: row.date,
            name: row.name,
            duration: row.duration_minutes,
            notes: row.notes || '',
            isTemplate: row.is_template,
            exercises: []
          });
        }

        const workout = workoutsMap.get(row.id);
        
        if (row.we_id) {
          let exercise = workout.exercises.find(ex => ex.id === row.we_id);
          if (!exercise) {
            exercise = {
              id: row.we_id,
              exerciseId: row.exercise_id,
              exercise: {
                id: row.exercise_id,
                name: row.exercise_name,
                category: row.category,
                muscleGroups: row.muscle_groups || []
              },
              targetSets: row.target_sets,
              targetReps: row.target_reps,
              targetWeight: row.target_weight ? parseFloat(row.target_weight) : null,
              sets: []
            };
            workout.exercises.push(exercise);
          }

          if (row.set_id) {
            exercise.sets.push({
              id: row.set_id,
              weight: parseFloat(row.weight),
              reps: parseInt(row.reps),
              rpe: row.rpe ? parseFloat(row.rpe) : null,
              completedAt: row.completed_at,
              notes: row.set_notes || ''
            });
          }
        }
      });

      return Array.from(workoutsMap.values());
    } finally {
      client.release();
    }
  }

  async getWorkoutById(userId, workoutId) {
    const client = await this.pool.connect();
    try {
      const workouts = await this.getAllWorkouts(userId);
      return workouts.find(w => w.id === workoutId) || null;
    } finally {
      client.release();
    }
  }

  async createWorkout(userId, workout) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const workoutId = workout.id || uuidv4();
      
      // Insert workout
      await client.query(`
        INSERT INTO workouts (id, user_id, date, name, duration_minutes, notes, is_template)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        workoutId, userId, workout.date, workout.name || null, 
        workout.duration || null, workout.notes || '', workout.isTemplate || false
      ]);

      // Insert exercises and sets
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        const exerciseId = uuidv4();
        
        await client.query(`
          INSERT INTO workout_exercises (
            id, workout_id, exercise_id, order_index, target_sets, 
            target_reps, target_weight, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          exerciseId, workoutId, exercise.exerciseId, i,
          exercise.targetSets || null, exercise.targetReps || null,
          exercise.targetWeight || null, exercise.notes || ''
        ]);

        // Insert sets
        for (let j = 0; j < exercise.sets.length; j++) {
          const set = exercise.sets[j];
          await client.query(`
            INSERT INTO workout_sets (
              id, workout_exercise_id, set_number, weight, reps, rpe, 
              completed_at, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            uuidv4(), exerciseId, j + 1, set.weight, set.reps,
            set.rpe || null, set.completedAt || new Date().toISOString(),
            set.notes || ''
          ]);
        }
      }

      await this.updatePersonalRecords(userId, workoutId, workout);
      await client.query('COMMIT');
      
      return { id: workoutId, userId, ...workout };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateWorkout(userId, workoutId, workout) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verify workout belongs to user
      const existingWorkout = await client.query(
        'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
        [workoutId, userId]
      );
      
      if (existingWorkout.rows.length === 0) {
        throw new Error('Workout not found or access denied');
      }
      
      // Update workout
      await client.query(`
        UPDATE workouts SET 
          date = $1, name = $2, duration_minutes = $3, notes = $4, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $5
      `, [workout.date, workout.name || null, workout.duration || null, workout.notes || '', workoutId]);

      // Delete existing exercises and sets
      await client.query('DELETE FROM workout_exercises WHERE workout_id = $1', [workoutId]);

      // Insert new exercises and sets (same logic as create)
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        const exerciseId = uuidv4();
        
        await client.query(`
          INSERT INTO workout_exercises (
            id, workout_id, exercise_id, order_index, target_sets, 
            target_reps, target_weight, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          exerciseId, workoutId, exercise.exerciseId, i,
          exercise.targetSets || null, exercise.targetReps || null,
          exercise.targetWeight || null, exercise.notes || ''
        ]);

        for (let j = 0; j < exercise.sets.length; j++) {
          const set = exercise.sets[j];
          await client.query(`
            INSERT INTO workout_sets (
              id, workout_exercise_id, set_number, weight, reps, rpe, 
              completed_at, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            uuidv4(), exerciseId, j + 1, set.weight, set.reps,
            set.rpe || null, set.completedAt || new Date().toISOString(),
            set.notes || ''
          ]);
        }
      }

      await this.updatePersonalRecords(userId, workoutId, workout);
      await client.query('COMMIT');
      
      return { id: workoutId, userId, ...workout };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteWorkout(userId, workoutId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM workouts WHERE id = $1 AND user_id = $2',
        [workoutId, userId]
      );
      
      if (result.rowCount === 0) {
        throw new Error('Workout not found or access denied');
      }
      
      return { success: true, deleted: result.rowCount > 0 };
    } finally {
      client.release();
    }
  }

  // ========================================
  // PERSONAL RECORDS METHODS (User-specific)
  // ========================================

  async updatePersonalRecords(userId, workoutId, workout) {
    const client = await this.pool.connect();
    try {
      for (const exercise of workout.exercises) {
        if (exercise.sets.length === 0) continue;

        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        const maxReps = Math.max(...exercise.sets.map(s => s.reps));
        const maxVolume = Math.max(...exercise.sets.map(s => s.weight * s.reps));
        
        // Estimated 1RM using Epley formula: weight * (1 + reps/30)
        const estimated1RM = Math.max(...exercise.sets.map(s => 
          s.weight * (1 + s.reps / 30)
        ));

        const achievedAt = new Date().toISOString();

        // Update max weight record
        await client.query(`
          INSERT INTO personal_records (id, user_id, exercise_id, record_type, value, workout_id, achieved_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, exercise_id, record_type) DO UPDATE SET
            value = GREATEST(personal_records.value, EXCLUDED.value),
            workout_id = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.workout_id 
              ELSE personal_records.workout_id 
            END,
            achieved_at = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.achieved_at 
              ELSE personal_records.achieved_at 
            END
        `, [uuidv4(), userId, exercise.exerciseId, 'max_weight', maxWeight, workoutId, achievedAt]);

        // Update max reps record
        await client.query(`
          INSERT INTO personal_records (id, user_id, exercise_id, record_type, value, workout_id, achieved_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, exercise_id, record_type) DO UPDATE SET
            value = GREATEST(personal_records.value, EXCLUDED.value),
            workout_id = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.workout_id 
              ELSE personal_records.workout_id 
            END,
            achieved_at = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.achieved_at 
              ELSE personal_records.achieved_at 
            END
        `, [uuidv4(), userId, exercise.exerciseId, 'max_reps', maxReps, workoutId, achievedAt]);

        // Update max volume record
        await client.query(`
          INSERT INTO personal_records (id, user_id, exercise_id, record_type, value, workout_id, achieved_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, exercise_id, record_type) DO UPDATE SET
            value = GREATEST(personal_records.value, EXCLUDED.value),
            workout_id = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.workout_id 
              ELSE personal_records.workout_id 
            END,
            achieved_at = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.achieved_at 
              ELSE personal_records.achieved_at 
            END
        `, [uuidv4(), userId, exercise.exerciseId, 'max_volume', maxVolume, workoutId, achievedAt]);

        // Update estimated 1RM record
        await client.query(`
          INSERT INTO personal_records (id, user_id, exercise_id, record_type, value, workout_id, achieved_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, exercise_id, record_type) DO UPDATE SET
            value = GREATEST(personal_records.value, EXCLUDED.value),
            workout_id = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.workout_id 
              ELSE personal_records.workout_id 
            END,
            achieved_at = CASE 
              WHEN EXCLUDED.value > personal_records.value THEN EXCLUDED.achieved_at 
              ELSE personal_records.achieved_at 
            END
        `, [uuidv4(), userId, exercise.exerciseId, '1rm_estimated', estimated1RM, workoutId, achievedAt]);
      }
    } finally {
      client.release();
    }
  }

  async getAllPersonalRecords(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT pr.*, e.name as exercise_name
        FROM personal_records pr
        JOIN exercises e ON pr.exercise_id = e.id
        WHERE pr.user_id = $1
        ORDER BY pr.achieved_at DESC
      `, [userId]);

      // Group records by exercise
      const recordsMap = new Map();
      
      result.rows.forEach(row => {
        if (!recordsMap.has(row.exercise_id)) {
          recordsMap.set(row.exercise_id, {
            exerciseId: row.exercise_id,
            exerciseName: row.exercise_name,
            records: {}
          });
        }
        
        const exercise = recordsMap.get(row.exercise_id);
        exercise.records[row.record_type] = {
          value: parseFloat(row.value),
          achievedAt: row.achieved_at,
          workoutId: row.workout_id
        };
      });

      return Array.from(recordsMap.values());
    } finally {
      client.release();
    }
  }

  async getExerciseProgress(userId, exerciseId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          w.id as workout_id,
          w.date, 
          w.name as workout_name,
          e.name as exercise_name,
          ws.weight, ws.reps, ws.rpe, ws.completed_at
        FROM workouts w
        JOIN workout_exercises we ON w.id = we.workout_id
        JOIN exercises e ON we.exercise_id = e.id
        JOIN workout_sets ws ON we.id = ws.workout_exercise_id
        WHERE w.user_id = $1 AND e.id = $2
        ORDER BY w.date ASC, ws.set_number
      `, [userId, exerciseId]);

      const workoutsMap = new Map();

      result.rows.forEach(row => {
        if (!workoutsMap.has(row.date)) {
          workoutsMap.set(row.date, {
            date: row.date,
            workoutId: row.workout_id,
            workoutName: row.workout_name,
            sets: []
          });
        }
        
        workoutsMap.get(row.date).sets.push({
          weight: parseFloat(row.weight),
          reps: parseInt(row.reps),
          rpe: row.rpe ? parseFloat(row.rpe) : null,
          completedAt: row.completed_at
        });
      });

      const workouts = Array.from(workoutsMap.values()).map(workout => {
        const maxWeight = Math.max(...workout.sets.map(s => s.weight));
        const avgWeight = workout.sets.reduce((sum, s) => sum + s.weight, 0) / workout.sets.length;
        const totalReps = workout.sets.reduce((sum, s) => sum + s.reps, 0);
        const maxReps = Math.max(...workout.sets.map(s => s.reps));
        const totalVolume = workout.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        
        return {
          date: workout.date,
          workoutId: workout.workoutId,
          workoutName: workout.workoutName,
          maxWeight,
          avgWeight: Math.round(avgWeight * 100) / 100,
          totalVolume,
          totalReps,
          maxReps,
          setsCount: workout.sets.length,
          sets: workout.sets
        };
      });

      // Get personal records for this exercise
      const prResult = await client.query(`
        SELECT record_type, value, achieved_at
        FROM personal_records
        WHERE user_id = $1 AND exercise_id = $2
      `, [userId, exerciseId]);

      const personalRecord = {};
      prResult.rows.forEach(row => {
        personalRecord[row.record_type] = {
          value: parseFloat(row.value),
          date: row.achieved_at
        };
      });

      return {
        exerciseId,
        exerciseName: result.rows[0]?.exercise_name || '',
        workouts,
        personalRecord
      };
    } finally {
      client.release();
    }
  }

  // ========================================
  // BODY MEASUREMENTS METHODS
  // ========================================

  async addBodyMeasurement(userId, measurement) {
    const client = await this.pool.connect();
    try {
      const measurementId = uuidv4();
      
      await client.query(`
        INSERT INTO body_measurements (
          id, user_id, measurement_date, weight_kg, body_fat_percentage,
          muscle_mass_kg, measurements, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        measurementId, userId, measurement.date, measurement.weight,
        measurement.bodyFatPercentage, measurement.muscleMass,
        measurement.measurements ? JSON.stringify(measurement.measurements) : null,
        measurement.notes || ''
      ]);

      return { id: measurementId, userId, ...measurement };
    } finally {
      client.release();
    }
  }

  async getBodyMeasurements(userId, startDate = null, endDate = null) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT * FROM body_measurements 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (startDate) {
        query += ` AND measurement_date >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND measurement_date <= $${params.length + 1}`;
        params.push(endDate);
      }

      query += ` ORDER BY measurement_date DESC`;

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        date: row.measurement_date,
        weight: row.weight_kg ? parseFloat(row.weight_kg) : null,
        bodyFatPercentage: row.body_fat_percentage ? parseFloat(row.body_fat_percentage) : null,
        muscleMass: row.muscle_mass_kg ? parseFloat(row.muscle_mass_kg) : null,
        measurements: row.measurements ? JSON.parse(row.measurements) : null,
        notes: row.notes,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  }

  // ========================================
  // CLEANUP AND UTILITY METHODS
  // ========================================

  async cleanupExpiredSessions() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
      );
      
      console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

module.exports = Database;