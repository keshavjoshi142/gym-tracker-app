const { Pool } = require('pg');
const path = require('path');

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
      // Create exercises table
      await client.query(`
        CREATE TABLE IF NOT EXISTS exercises (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(255) NOT NULL,
          muscle_groups JSONB NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create workouts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workouts (
          id VARCHAR(255) PRIMARY KEY,
          date VARCHAR(255) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create workout_exercises table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workout_exercises (
          id VARCHAR(255) PRIMARY KEY,
          workout_id VARCHAR(255) NOT NULL,
          exercise_id VARCHAR(255) NOT NULL,
          order_index INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
        )
      `);

      // Create workout_sets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workout_sets (
          id VARCHAR(255) PRIMARY KEY,
          workout_exercise_id VARCHAR(255) NOT NULL,
          set_number INTEGER NOT NULL,
          weight DECIMAL NOT NULL DEFAULT 0,
          reps INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
        )
      `);

      // Create personal_records table
      await client.query(`
        CREATE TABLE IF NOT EXISTS personal_records (
          id VARCHAR(255) PRIMARY KEY,
          exercise_id VARCHAR(255) NOT NULL,
          max_weight DECIMAL NOT NULL DEFAULT 0,
          max_reps INTEGER NOT NULL DEFAULT 0,
          max_volume DECIMAL NOT NULL DEFAULT 0,
          date VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
          UNIQUE(exercise_id)
        )
      `);

      await this.seedDefaultExercises();
      console.log('✅ Database initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async seedDefaultExercises() {
    const defaultExercises = [
      {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'Chest',
        muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
        description: 'Classic chest exercise using a barbell'
      },
      {
        id: 'squat',
        name: 'Squat',
        category: 'Legs',
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        description: 'Fundamental lower body exercise'
      },
      {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'Back',
        muscleGroups: ['Back', 'Hamstrings', 'Glutes'],
        description: 'Full body compound movement'
      },
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        category: 'Shoulders',
        muscleGroups: ['Shoulders', 'Triceps', 'Core'],
        description: 'Standing shoulder press movement'
      },
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        category: 'Back',
        muscleGroups: ['Back', 'Biceps'],
        description: 'Bodyweight upper body pulling exercise'
      }
    ];

    for (const exercise of defaultExercises) {
      await this.createExercise(exercise);
    }
  }

  // Exercise methods
  async getAllExercises() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM exercises ORDER BY name');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        muscleGroups: row.muscle_groups,
        description: row.description
      }));
    } finally {
      client.release();
    }
  }

  async createExercise(exercise) {
    const client = await this.pool.connect();
    try {
      const id = exercise.id || uuidv4();
      const result = await client.query(
        `INSERT INTO exercises (id, name, category, muscle_groups, description) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO NOTHING 
         RETURNING *`,
        [id, exercise.name, exercise.category, JSON.stringify(exercise.muscleGroups), exercise.description || '']
      );
      
      return result.rows[0] || { id, ...exercise };
    } finally {
      client.release();
    }
  }

  // Workout methods
  async getAllWorkouts() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          w.*,
          we.id as we_id, we.exercise_id, we.order_index,
          e.name as exercise_name, e.category, e.muscle_groups,
          ws.id as set_id, ws.set_number, ws.weight, ws.reps, ws.notes as set_notes
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.id = we.workout_id
        LEFT JOIN exercises e ON we.exercise_id = e.id
        LEFT JOIN workout_sets ws ON we.id = ws.workout_exercise_id
        ORDER BY w.date DESC, we.order_index, ws.set_number
      `);

      const workoutsMap = new Map();

      result.rows.forEach(row => {
        if (!workoutsMap.has(row.id)) {
          workoutsMap.set(row.id, {
            id: row.id,
            date: row.date,
            notes: row.notes || '',
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
              name: row.exercise_name,
              category: row.category,
              muscleGroups: row.muscle_groups || [],
              sets: []
            };
            workout.exercises.push(exercise);
          }

          if (row.set_id) {
            exercise.sets.push({
              id: row.set_id,
              weight: parseFloat(row.weight),
              reps: parseInt(row.reps),
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

  async createWorkout(workout) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const workoutId = workout.id || uuidv4();
      
      // Insert workout
      await client.query(
        'INSERT INTO workouts (id, date, notes) VALUES ($1, $2, $3)',
        [workoutId, workout.date, workout.notes || '']
      );

      // Insert exercises and sets
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        const exerciseId = uuidv4();
        
        await client.query(
          'INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ($1, $2, $3, $4)',
          [exerciseId, workoutId, exercise.exerciseId, i]
        );

        // Insert sets
        for (let j = 0; j < exercise.sets.length; j++) {
          const set = exercise.sets[j];
          await client.query(
            'INSERT INTO workout_sets (id, workout_exercise_id, set_number, weight, reps, notes) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), exerciseId, j + 1, set.weight, set.reps, set.notes || '']
          );
        }
      }

      await this.updatePersonalRecords(workout);
      await client.query('COMMIT');
      
      return { id: workoutId, ...workout };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateWorkout(id, workout) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update workout
      await client.query(
        'UPDATE workouts SET date = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [workout.date, workout.notes || '', id]
      );

      // Delete existing exercises and sets
      await client.query('DELETE FROM workout_exercises WHERE workout_id = $1', [id]);

      // Insert new exercises and sets
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        const exerciseId = uuidv4();
        
        await client.query(
          'INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ($1, $2, $3, $4)',
          [exerciseId, id, exercise.exerciseId, i]
        );

        for (let j = 0; j < exercise.sets.length; j++) {
          const set = exercise.sets[j];
          await client.query(
            'INSERT INTO workout_sets (id, workout_exercise_id, set_number, weight, reps, notes) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), exerciseId, j + 1, set.weight, set.reps, set.notes || '']
          );
        }
      }

      await this.updatePersonalRecords(workout);
      await client.query('COMMIT');
      
      return { id, ...workout };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteWorkout(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM workouts WHERE id = $1', [id]);
      return { deleted: result.rowCount > 0 };
    } finally {
      client.release();
    }
  }

  // Personal Records methods
  async updatePersonalRecords(workout) {
    const client = await this.pool.connect();
    try {
      for (const exercise of workout.exercises) {
        if (exercise.sets.length === 0) continue;

        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        const maxReps = Math.max(...exercise.sets.map(s => s.reps));
        const maxVolume = Math.max(...exercise.sets.map(s => s.weight * s.reps));

        await client.query(`
          INSERT INTO personal_records (id, exercise_id, max_weight, max_reps, max_volume, date)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (exercise_id) DO UPDATE SET
            max_weight = GREATEST(personal_records.max_weight, EXCLUDED.max_weight),
            max_reps = GREATEST(personal_records.max_reps, EXCLUDED.max_reps),
            max_volume = GREATEST(personal_records.max_volume, EXCLUDED.max_volume),
            date = CASE 
              WHEN EXCLUDED.max_weight > personal_records.max_weight OR 
                   EXCLUDED.max_reps > personal_records.max_reps OR 
                   EXCLUDED.max_volume > personal_records.max_volume 
              THEN EXCLUDED.date 
              ELSE personal_records.date 
            END,
            updated_at = CURRENT_TIMESTAMP
        `, [uuidv4(), exercise.exerciseId, maxWeight, maxReps, maxVolume, workout.date]);
      }
    } finally {
      client.release();
    }
  }

  async getAllPersonalRecords() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM personal_records');
      return result.rows.map(row => ({
        exerciseId: row.exercise_id,
        maxWeight: parseFloat(row.max_weight),
        maxReps: parseInt(row.max_reps),
        maxVolume: parseFloat(row.max_volume),
        date: row.date
      }));
    } finally {
      client.release();
    }
  }

  async getExerciseProgress(exerciseId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          w.date, 
          e.name as exercise_name,
          ws.weight, ws.reps
        FROM workouts w
        JOIN workout_exercises we ON w.id = we.workout_id
        JOIN exercises e ON we.exercise_id = e.id
        JOIN workout_sets ws ON we.id = ws.workout_exercise_id
        WHERE e.id = $1
        ORDER BY w.date ASC, ws.set_number
      `, [exerciseId]);

      const workoutsMap = new Map();

      result.rows.forEach(row => {
        if (!workoutsMap.has(row.date)) {
          workoutsMap.set(row.date, {
            date: row.date,
            sets: []
          });
        }
        
        workoutsMap.get(row.date).sets.push({
          weight: parseFloat(row.weight),
          reps: parseInt(row.reps)
        });
      });

      const workouts = Array.from(workoutsMap.values()).map(workout => {
        const maxWeight = Math.max(...workout.sets.map(s => s.weight));
        const totalVolume = workout.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        
        return {
          date: workout.date,
          maxWeight,
          totalVolume,
          sets: workout.sets.length,
          allSets: workout.sets
        };
      });

      const personalRecord = workouts.length > 0 ? {
        maxWeight: Math.max(...workouts.map(w => w.maxWeight)),
        maxReps: Math.max(...result.rows.map(r => parseInt(r.reps))),
        maxVolume: Math.max(...workouts.map(w => w.totalVolume)),
        date: workouts[workouts.length - 1]?.date || new Date().toISOString()
      } : {
        maxWeight: 0,
        maxReps: 0,
        maxVolume: 0,
        date: new Date().toISOString()
      };

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

  async close() {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

module.exports = Database;