import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise, Workout, PersonalRecord, ExerciseProgress, User } from '@/types';
import { generateId } from './helpers';
import { DEFAULT_EXERCISES } from '@/data/exercises';
import ApiService from './api';
import Constants from 'expo-constants';

export class StorageService {
  // Configuration: Backend-only authentication (no local auth fallbacks)
  private static USE_API: boolean = true;
  private static OFFLINE_MODE: boolean = false;
  
  // Debug: Log storage configuration
  static {
    console.log('💾 Storage Config:', {
      USE_API: this.USE_API,
      ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
      API_URL: process.env.EXPO_PUBLIC_API_URL
    });
  }

  // Storage keys for app data only (no user auth data)
  private static STORAGE_KEYS = {
    EXERCISES: 'gym_tracker_exercises',
    WORKOUTS: 'gym_tracker_workouts',
    PERSONAL_RECORDS: 'gym_tracker_personal_records',
    OFFLINE_CHANGES: 'gym_tracker_offline_changes',
    CURRENT_USER: 'gym_tracker_current_user', // UI cache only, not for auth
  };

  // Network connectivity check
  private static async checkConnectivity(): Promise<boolean> {
    try {
      if (!this.USE_API) return false;
      
      await ApiService.healthCheck();
      this.OFFLINE_MODE = false;
      return true;
    } catch (error) {
      console.log('API not available, using offline mode');
      this.OFFLINE_MODE = true;
      return false;
    }
  }

  // Exercise methods
  static async getExercises(): Promise<Exercise[]> {
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        const exercises = await ApiService.getExercises();
        // Cache locally for offline access
        await AsyncStorage.setItem(this.STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
        return exercises;
      }
    } catch (error) {
      console.error('Error fetching exercises from API:', error);
    }

    // Fallback to local storage
    return this.getLocalExercises();
  }

  private static async getLocalExercises(): Promise<Exercise[]> {
    try {
      const exercisesJson = await AsyncStorage.getItem(this.STORAGE_KEYS.EXERCISES);
      if (exercisesJson) {
        return JSON.parse(exercisesJson);
      }
    } catch (error) {
      console.error('Error reading local exercises:', error);
    }

    // Return default exercises if nothing found
    await this.saveLocalExercises(DEFAULT_EXERCISES);
    return DEFAULT_EXERCISES;
  }

  private static async saveLocalExercises(exercises: Exercise[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    } catch (error) {
      console.error('Error saving local exercises:', error);
    }
  }

  static async saveExercises(exercises: Exercise[]): Promise<void> {
    await this.saveLocalExercises(exercises);
  }

  static async addExercise(exercise: Exercise): Promise<void> {
    const exerciseWithId = { ...exercise, id: exercise.id || generateId() };
    
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        await ApiService.createExercise(exerciseWithId);
        // Update local cache
        const exercises = await this.getLocalExercises();
        const updatedExercises = [...exercises, exerciseWithId];
        await this.saveLocalExercises(updatedExercises);
        return;
      }
    } catch (error) {
      console.error('Error saving exercise to API:', error);
    }

    // Fallback to local storage
    const exercises = await this.getLocalExercises();
    const updatedExercises = [...exercises, exerciseWithId];
    await this.saveLocalExercises(updatedExercises);
    
    // Queue for sync when online
    await this.queueOfflineChange('CREATE_EXERCISE', exerciseWithId);
  }

  // Workout methods
  static async getWorkouts(): Promise<Workout[]> {
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        const workouts = await ApiService.getWorkouts();
        // Cache locally for offline access
        await AsyncStorage.setItem(this.STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
        return workouts;
      }
    } catch (error) {
      console.error('Error fetching workouts from API:', error);
    }

    // Fallback to local storage
    return this.getLocalWorkouts();
  }

  private static async getLocalWorkouts(): Promise<Workout[]> {
    try {
      const workoutsJson = await AsyncStorage.getItem(this.STORAGE_KEYS.WORKOUTS);
      if (workoutsJson) {
        return JSON.parse(workoutsJson);
      }
    } catch (error) {
      console.error('Error reading local workouts:', error);
    }
    return [];
  }

  private static async saveLocalWorkouts(workouts: Workout[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch (error) {
      console.error('Error saving local workouts:', error);
    }
  }

  static async saveWorkout(workout: Workout): Promise<void> {
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        // Check if workout exists (has id and it's not a temp id)
        if (workout.id && !workout.id.startsWith('temp-')) {
          try {
            await ApiService.updateWorkout(workout.id, workout);
          } catch (updateError: any) {
            console.log('Update failed, trying to create workout instead:', updateError.message);
            // If update fails (workout doesn't exist in DB), try creating it
            const workoutToCreate = { ...workout };
            const originalId = workoutToCreate.id;
            delete (workoutToCreate as any).id; // Remove id for creation
            
            try {
              const savedWorkout = await ApiService.createWorkout(workoutToCreate);
              workout.id = savedWorkout.id; // Update workout with new real id
              console.log('Successfully created workout with new ID:', workout.id);
            } catch (createError) {
              console.error('Failed to create workout after update failed:', createError);
              throw updateError; // Throw original update error
            }
          }
        } else {
          const workoutToCreate = { ...workout };
          if (workoutToCreate.id) {
            delete (workoutToCreate as any).id; // Remove temp id if exists
          }
          const savedWorkout = await ApiService.createWorkout(workoutToCreate);
          workout.id = savedWorkout.id; // Update workout with real id
        }
        
        // Update local cache
        const workouts = await this.getLocalWorkouts();
        const workoutIndex = workouts.findIndex(w => w.id === workout.id);
        if (workoutIndex >= 0) {
          workouts[workoutIndex] = workout;
        } else {
          workouts.push(workout);
        }
        await this.saveLocalWorkouts(workouts);
        await this.updatePersonalRecords(workout);
        return;
      }
    } catch (error) {
      console.error('Error saving workout to API:', error);
    }

    // Fallback to local storage
    if (!workout.id) {
      workout.id = generateId();
    }
    
    const workouts = await this.getLocalWorkouts();
    const workoutIndex = workouts.findIndex(w => w.id === workout.id);
    
    if (workoutIndex >= 0) {
      workouts[workoutIndex] = workout;
      await this.queueOfflineChange('UPDATE_WORKOUT', workout);
    } else {
      workouts.push(workout);
      await this.queueOfflineChange('CREATE_WORKOUT', workout);
    }
    
    await this.saveLocalWorkouts(workouts);
    await this.updatePersonalRecords(workout);
  }

  static async deleteWorkout(id: string): Promise<void> {
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        await ApiService.deleteWorkout(id);
        // Update local cache
        const workouts = await this.getLocalWorkouts();
        const filteredWorkouts = workouts.filter(w => w.id !== id);
        await this.saveLocalWorkouts(filteredWorkouts);
        return;
      }
    } catch (error) {
      console.error('Error deleting workout from API:', error);
    }

    // Fallback to local storage
    const workouts = await this.getLocalWorkouts();
    const filteredWorkouts = workouts.filter(w => w.id !== id);
    await this.saveLocalWorkouts(filteredWorkouts);
    
    // Queue for sync when online
    await this.queueOfflineChange('DELETE_WORKOUT', { id });
  }

  // Personal Records methods
  static async getPersonalRecords(): Promise<PersonalRecord[]> {
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        const records = await ApiService.getPersonalRecords();
        // Cache locally for offline access
        await AsyncStorage.setItem(this.STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(records));
        return records;
      }
    } catch (error) {
      console.error('Error fetching personal records from API:', error);
    }

    // Fallback to local storage
    return this.getLocalPersonalRecords();
  }

  private static async getLocalPersonalRecords(): Promise<PersonalRecord[]> {
    try {
      const recordsJson = await AsyncStorage.getItem(this.STORAGE_KEYS.PERSONAL_RECORDS);
      if (recordsJson) {
        return JSON.parse(recordsJson);
      }
    } catch (error) {
      console.error('Error reading local personal records:', error);
    }
    return [];
  }

  static async updatePersonalRecords(workout: Workout): Promise<void> {
    try {
      const personalRecords = await this.getLocalPersonalRecords();

      for (const workoutExercise of workout.exercises) {
        const exerciseId = workoutExercise.exerciseId;
        const existingRecord = personalRecords.find(pr => pr.exerciseId === exerciseId);

        // Calculate max values from current workout
        const maxWeight = Math.max(...workoutExercise.sets.map(s => s.weight));
        const maxReps = Math.max(...workoutExercise.sets.map(s => s.reps));
        const maxVolume = Math.max(...workoutExercise.sets.map(s => s.weight * s.reps));

        if (!existingRecord) {
          // Create new personal record
          personalRecords.push({
            exerciseId,
            maxWeight,
            maxReps,
            maxVolume,
            date: workout.date,
          });
        } else {
          // Update existing record if new values are higher
          let updated = false;
          
          if (maxWeight > existingRecord.maxWeight) {
            existingRecord.maxWeight = maxWeight;
            updated = true;
          }
          
          if (maxReps > existingRecord.maxReps) {
            existingRecord.maxReps = maxReps;
            updated = true;
          }
          
          if (maxVolume > existingRecord.maxVolume) {
            existingRecord.maxVolume = maxVolume;
            updated = true;
          }

          if (updated) {
            existingRecord.date = workout.date;
          }
        }
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(personalRecords));
    } catch (error) {
      console.error('Error updating personal records:', error);
    }
  }

  // Exercise Progress
  static async getExerciseProgress(exerciseId: string): Promise<ExerciseProgress | null> {
    try {
      const isOnline = await this.checkConnectivity();
      
      if (isOnline) {
        const progress = await ApiService.getExerciseProgress(exerciseId);
        return progress;
      }
    } catch (error) {
      console.error('Error fetching exercise progress from API:', error);
    }

    // Fallback to local calculation
    return this.calculateLocalExerciseProgress(exerciseId);
  }

  private static async calculateLocalExerciseProgress(exerciseId: string): Promise<ExerciseProgress | null> {
    try {
      console.log('Calculating local exercise progress for:', exerciseId);
      
      const workouts = await this.getLocalWorkouts();
      const exercises = await this.getLocalExercises();
      const personalRecords = await this.getLocalPersonalRecords();

      console.log('Total workouts found:', workouts.length);
      console.log('All workout exercise IDs:', workouts.map(w => 
        w.exercises.map(e => e.exerciseId)
      ));

      const exercise = exercises.find(e => e.id === exerciseId);
      const personalRecord = personalRecords.find(pr => pr.exerciseId === exerciseId);

      if (!exercise) {
        console.log('Exercise not found:', exerciseId);
        return null;
      }

      // Get all workouts containing this exercise
      const exerciseWorkouts = workouts
        .filter(workout => 
          workout.exercises.some(we => we.exerciseId === exerciseId)
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(workout => {
          const workoutExercise = workout.exercises.find(we => we.exerciseId === exerciseId)!;
          const maxWeight = Math.max(...workoutExercise.sets.map(s => s.weight));
          const avgWeight = workoutExercise.sets.reduce((sum, set) => sum + set.weight, 0) / workoutExercise.sets.length;
          const totalVolume = workoutExercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          const totalReps = workoutExercise.sets.reduce((sum, set) => sum + set.reps, 0);
          const maxReps = Math.max(...workoutExercise.sets.map(s => s.reps));
          
          return {
            date: workout.date,
            workoutId: workout.id,
            maxWeight,
            avgWeight,
            totalVolume,
            totalReps,
            maxReps,
            sets: workoutExercise.sets.map(set => ({
              weight: set.weight,
              reps: set.reps,
              notes: set.notes,
            })),
            setsCount: workoutExercise.sets.length,
          };
        });

      console.log('Exercise workouts found:', exerciseWorkouts.length);
      console.log('Exercise workout data:', exerciseWorkouts);

      return {
        exerciseId,
        exerciseName: exercise.name,
        workouts: exerciseWorkouts,
        personalRecord: personalRecord || {
          exerciseId,
          maxWeight: 0,
          maxReps: 0,
          maxVolume: 0,
          date: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error calculating local exercise progress:', error);
      return null;
    }
  }

  // Offline sync methods
  private static async queueOfflineChange(type: string, data: any): Promise<void> {
    try {
      const changesJson = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_CHANGES);
      const changes = changesJson ? JSON.parse(changesJson) : [];
      
      changes.push({
        id: generateId(),
        type,
        data,
        timestamp: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_CHANGES, JSON.stringify(changes));
    } catch (error) {
      console.error('Error queuing offline change:', error);
    }
  }

  static async syncOfflineChanges(): Promise<void> {
    try {
      const changesJson = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_CHANGES);
      if (!changesJson) return;
      
      const changes = JSON.parse(changesJson);
      if (changes.length === 0) return;

      console.log(`Syncing ${changes.length} offline changes...`);
      
      for (const change of changes) {
        try {
          switch (change.type) {
            case 'CREATE_EXERCISE':
              await ApiService.createExercise(change.data);
              break;
            case 'CREATE_WORKOUT':
              await ApiService.createWorkout(change.data);
              break;
            case 'UPDATE_WORKOUT':
              await ApiService.updateWorkout(change.data.id, change.data);
              break;
            case 'DELETE_WORKOUT':
              await ApiService.deleteWorkout(change.data.id);
              break;
          }
        } catch (error) {
          console.error(`Failed to sync change ${change.id}:`, error);
          // Keep failed changes for retry
          continue;
        }
      }

      // Clear successfully synced changes
      await AsyncStorage.removeItem(this.STORAGE_KEYS.OFFLINE_CHANGES);
      console.log('Offline changes synced successfully');
      
      // Refresh local cache with server data
      await this.refreshLocalCache();
      
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }
  }

  private static async refreshLocalCache(): Promise<void> {
    try {
      const [exercises, workouts, personalRecords] = await Promise.all([
        ApiService.getExercises(),
        ApiService.getWorkouts(),
        ApiService.getPersonalRecords(),
      ]);

      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEYS.EXERCISES, JSON.stringify(exercises)),
        AsyncStorage.setItem(this.STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts)),
        AsyncStorage.setItem(this.STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(personalRecords)),
      ]);

      console.log('Local cache refreshed');
    } catch (error) {
      console.error('Error refreshing local cache:', error);
    }
  }

  // Utility methods
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.EXERCISES),
        AsyncStorage.removeItem(this.STORAGE_KEYS.WORKOUTS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.PERSONAL_RECORDS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.OFFLINE_CHANGES),
      ]);
      console.log('All local data cleared');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  static getConnectionStatus(): { isOnline: boolean; isOfflineMode: boolean } {
    return {
      isOnline: !this.OFFLINE_MODE && this.USE_API,
      isOfflineMode: this.OFFLINE_MODE || !this.USE_API,
    };
  }

  // User Authentication Methods - Backend Only
  static async registerUser(username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<User | null> {
    try {
      console.log('🔑 Starting registration process for:', username);
      
      // Only use API for registration - no local fallback
      const response = await ApiService.register({
        username: username.trim(),
        email: email?.trim() || `${username}@example.com`,
        password,
        firstName,
        lastName,
      });

      console.log('📨 API registration response:', { hasUser: !!response.user });

      if (response.user) {
        console.log('✅ Registration successful, now logging in...');
        // After successful registration, automatically login to get JWT token
        return await this.loginUser(username, password);
      }
      
      console.log('❌ Registration failed - no user in response');
      return null;
    } catch (error) {
      console.error('❌ Backend registration failed:', error);
      throw error; // Don't provide local fallback
    }
  }

  static async loginUser(username: string, password: string): Promise<User | null> {
    try {
      console.log('🔑 Starting login process for:', username);
      
      // Only use API for login - no connectivity check or local fallback
      console.log('📡 Calling backend API for authentication...');
      const response = await ApiService.login(username, password);
      console.log('📨 API login response:', { hasToken: !!response.token, hasUser: !!response.user });
      
      if (response.token && response.user) {
        console.log('💾 Storing JWT token in secure storage...');
        // Store the JWT token securely
        await ApiService.setAuthToken(response.token);
        
        // Verify token was stored
        const storedToken = await ApiService.hasAuthToken();
        console.log('✅ Token storage verification:', storedToken);
        
        // Store minimal user info for UI purposes only (not for auth)
        await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
        
        console.log('✅ Login successful - user authenticated with backend');
        return response.user;
      }
      
      console.log('❌ Login failed - missing token or user in response');
      return null;
    } catch (error) {
      console.error('❌ Backend authentication failed:', error);
      throw error; // Don't provide local fallback
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      console.log('👤 Getting current user from backend...');
      
      // First check if we have a valid JWT token
      const hasToken = await ApiService.hasAuthToken();
      if (!hasToken) {
        console.log('❌ No auth token found - user not authenticated');
        await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
        return null;
      }
      
      // Always validate with backend - no local storage authentication
      try {
        console.log('📡 Validating user session with backend...');
        const response = await ApiService.getCurrentUser();
        
        if (response.user) {
          console.log('✅ User session valid, updating local cache');
          // Update local cache for UI purposes only
          await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
          return response.user;
        }
      } catch (error: any) {
        console.error('❌ Backend user validation failed:', error);
        
        // If backend says token is invalid/expired, clear everything
        if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
          console.log('🚫 Invalid/expired token detected - clearing auth state');
          await this.logoutUser();
          return null;
        }
        
        // For network errors, throw so app can handle appropriately
        throw error;
      }
      
      // If we get here, something went wrong
      console.log('❌ Unable to validate user session');
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw error; // Let the calling code handle the error
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      console.log('🚪 Starting logout process...');
      
      // Always try to logout via backend API
      try {
        console.log('📡 Notifying backend of logout...');
        await ApiService.logout();
        console.log('✅ Backend logout successful');
      } catch (error) {
        console.error('❌ Backend logout failed:', error);
        // Continue with local cleanup even if backend logout fails
      }

      // Clear all local authentication state
      console.log('🗑️ Clearing local authentication data...');
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
      await ApiService.clearAuthToken();
      
      console.log('✅ Logout completed - user session terminated');
    } catch (error) {
      console.error('❌ Error during logout process:', error);
      throw error; // Re-throw to let AuthContext handle it
    }
  }

  // Profile updates - Backend only
  static async updateUserProfile(profile: Partial<User['profile']>): Promise<boolean> {
    try {
      console.log('👤 Updating user profile via backend...');
      
      // Only use backend API for profile updates
      await ApiService.updateProfile(profile);
      
      // Refresh user data from backend after update
      const updatedUser = await this.getCurrentUser();
      
      console.log('✅ Profile updated successfully');
      return !!updatedUser;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error; // Don't provide local fallback
    }
  }
}