const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, 'gymtracker.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create exercises table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            muscle_groups TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create workouts table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS workouts (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create workout_exercises table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS workout_exercises (
            id TEXT PRIMARY KEY,
            workout_id TEXT NOT NULL,
            exercise_id TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
            FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
          )
        `);

        // Create workout_sets table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS workout_sets (
            id TEXT PRIMARY KEY,
            workout_exercise_id TEXT NOT NULL,
            set_number INTEGER NOT NULL,
            weight REAL NOT NULL DEFAULT 0,
            reps INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
          )
        `);

        // Create personal_records table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS personal_records (
            id TEXT PRIMARY KEY,
            exercise_id TEXT NOT NULL,
            max_weight REAL NOT NULL DEFAULT 0,
            max_reps INTEGER NOT NULL DEFAULT 0,
            max_volume REAL NOT NULL DEFAULT 0,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
            UNIQUE(exercise_id)
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            this.seedDefaultExercises().then(() => {
              resolve();
            }).catch(reject);
          }
        });
      });
    });
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
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM exercises ORDER BY name', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const exercises = rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            muscleGroups: JSON.parse(row.muscle_groups),
            description: row.description
          }));
          resolve(exercises);
        }
      });
    });
  }

  async createExercise(exercise) {
    return new Promise((resolve, reject) => {
      const id = exercise.id || uuidv4();
      const sql = `
        INSERT OR IGNORE INTO exercises (id, name, category, muscle_groups, description)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        id,
        exercise.name,
        exercise.category,
        JSON.stringify(exercise.muscleGroups),
        exercise.description || ''
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...exercise });
        }
      });
    });
  }

  // Workout methods
  async getAllWorkouts() {
    return new Promise((resolve, reject) => {
      const sql = `
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
      `;

      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const workoutsMap = new Map();

          rows.forEach(row => {
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
                  muscleGroups: JSON.parse(row.muscle_groups || '[]'),
                  sets: []
                };
                workout.exercises.push(exercise);
              }

              if (row.set_id) {
                exercise.sets.push({
                  id: row.set_id,
                  weight: row.weight,
                  reps: row.reps,
                  notes: row.set_notes || ''
                });
              }
            }
          });

          resolve(Array.from(workoutsMap.values()));
        }
      });
    });
  }

  async createWorkout(workout) {
    return new Promise((resolve, reject) => {
      const workoutId = workout.id || uuidv4();
      
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Insert workout
        const workoutSql = 'INSERT INTO workouts (id, date, notes) VALUES (?, ?, ?)';
        this.db.run(workoutSql, [workoutId, workout.date, workout.notes || ''], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Insert exercises and sets
          let completed = 0;
          const total = workout.exercises.length;

          if (total === 0) {
            this.db.run('COMMIT');
            resolve({ id: workoutId, ...workout });
            return;
          }

          workout.exercises.forEach((exercise, index) => {
            const exerciseId = uuidv4();
            const exerciseSql = `
              INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index)
              VALUES (?, ?, ?, ?)
            `;

            this.db.run(exerciseSql, [exerciseId, workoutId, exercise.exerciseId, index], (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }

              // Insert sets
              if (exercise.sets.length === 0) {
                completed++;
                if (completed === total) {
                  this.db.run('COMMIT');
                  resolve({ id: workoutId, ...workout });
                }
                return;
              }

              let setsCompleted = 0;
              exercise.sets.forEach((set, setIndex) => {
                const setSql = `
                  INSERT INTO workout_sets (id, workout_exercise_id, set_number, weight, reps, notes)
                  VALUES (?, ?, ?, ?, ?, ?)
                `;

                this.db.run(setSql, [
                  uuidv4(),
                  exerciseId,
                  setIndex + 1,
                  set.weight,
                  set.reps,
                  set.notes || ''
                ], (err) => {
                  if (err) {
                    this.db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  setsCompleted++;
                  if (setsCompleted === exercise.sets.length) {
                    completed++;
                    if (completed === total) {
                      this.db.run('COMMIT');
                      this.updatePersonalRecords(workout).then(() => {
                        resolve({ id: workoutId, ...workout });
                      }).catch(reject);
                    }
                  }
                });
              });
            });
          });
        });
      });
    });
  }

  async updateWorkout(id, workout) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Update workout
        const workoutSql = 'UPDATE workouts SET date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        this.db.run(workoutSql, [workout.date, workout.notes || '', id], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Delete existing exercises and sets
          this.db.run('DELETE FROM workout_exercises WHERE workout_id = ?', [id], (err) => {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Insert new exercises and sets (same logic as createWorkout)
            let completed = 0;
            const total = workout.exercises.length;

            if (total === 0) {
              this.db.run('COMMIT');
              resolve({ id, ...workout });
              return;
            }

            workout.exercises.forEach((exercise, index) => {
              const exerciseId = uuidv4();
              const exerciseSql = `
                INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index)
                VALUES (?, ?, ?, ?)
              `;

              this.db.run(exerciseSql, [exerciseId, id, exercise.exerciseId, index], (err) => {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                if (exercise.sets.length === 0) {
                  completed++;
                  if (completed === total) {
                    this.db.run('COMMIT');
                    resolve({ id, ...workout });
                  }
                  return;
                }

                let setsCompleted = 0;
                exercise.sets.forEach((set, setIndex) => {
                  const setSql = `
                    INSERT INTO workout_sets (id, workout_exercise_id, set_number, weight, reps, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `;

                  this.db.run(setSql, [
                    uuidv4(),
                    exerciseId,
                    setIndex + 1,
                    set.weight,
                    set.reps,
                    set.notes || ''
                  ], (err) => {
                    if (err) {
                      this.db.run('ROLLBACK');
                      reject(err);
                      return;
                    }

                    setsCompleted++;
                    if (setsCompleted === exercise.sets.length) {
                      completed++;
                      if (completed === total) {
                        this.db.run('COMMIT');
                        this.updatePersonalRecords(workout).then(() => {
                          resolve({ id, ...workout });
                        }).catch(reject);
                      }
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  async deleteWorkout(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM workouts WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
      });
    });
  }

  // Personal Records methods
  async updatePersonalRecords(workout) {
    for (const exercise of workout.exercises) {
      if (exercise.sets.length === 0) continue;

      const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
      const maxReps = Math.max(...exercise.sets.map(s => s.reps));
      const maxVolume = Math.max(...exercise.sets.map(s => s.weight * s.reps));

      await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO personal_records (id, exercise_id, max_weight, max_reps, max_volume, date)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(exercise_id) DO UPDATE SET
            max_weight = MAX(max_weight, excluded.max_weight),
            max_reps = MAX(max_reps, excluded.max_reps),
            max_volume = MAX(max_volume, excluded.max_volume),
            date = CASE 
              WHEN excluded.max_weight > max_weight OR 
                   excluded.max_reps > max_reps OR 
                   excluded.max_volume > max_volume 
              THEN excluded.date 
              ELSE date 
            END,
            updated_at = CURRENT_TIMESTAMP
        `;

        this.db.run(sql, [
          uuidv4(),
          exercise.exerciseId,
          maxWeight,
          maxReps,
          maxVolume,
          workout.date
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  async getAllPersonalRecords() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM personal_records', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            exerciseId: row.exercise_id,
            maxWeight: row.max_weight,
            maxReps: row.max_reps,
            maxVolume: row.max_volume,
            date: row.date
          })));
        }
      });
    });
  }

  async getExerciseProgress(exerciseId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          w.date, 
          e.name as exercise_name,
          ws.weight, ws.reps
        FROM workouts w
        JOIN workout_exercises we ON w.id = we.workout_id
        JOIN exercises e ON we.exercise_id = e.id
        JOIN workout_sets ws ON we.id = ws.workout_exercise_id
        WHERE e.id = ?
        ORDER BY w.date ASC, ws.set_number
      `;

      this.db.all(sql, [exerciseId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const workoutsMap = new Map();

          rows.forEach(row => {
            if (!workoutsMap.has(row.date)) {
              workoutsMap.set(row.date, {
                date: row.date,
                sets: []
              });
            }
            
            workoutsMap.get(row.date).sets.push({
              weight: row.weight,
              reps: row.reps
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
            maxReps: Math.max(...rows.map(r => r.reps)),
            maxVolume: Math.max(...workouts.map(w => w.totalVolume)),
            date: workouts[workouts.length - 1]?.date || new Date().toISOString()
          } : {
            maxWeight: 0,
            maxReps: 0,
            maxVolume: 0,
            date: new Date().toISOString()
          };

          resolve({
            exerciseId,
            exerciseName: rows[0]?.exercise_name || '',
            workouts,
            personalRecord
          });
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
        resolve();
      });
    });
  }
}

module.exports = Database;