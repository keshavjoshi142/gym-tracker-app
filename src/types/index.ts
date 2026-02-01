export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  description?: string;
  instructions?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  restTime?: number; // in seconds
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  personalRecord?: {
    maxWeight: number;
    maxReps: number;
    maxVolume: number; // weight * reps
  };
}

export interface Workout {
  id: string;
  date: string;
  name?: string;
  exercises: WorkoutExercise[];
  duration?: number; // in minutes
  notes?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  date: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    weight?: number;
    height?: number;
    goals?: string[];
  };
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  workouts: Array<{
    date: string;
    workoutId: string;
    maxWeight: number;
    avgWeight: number;
    totalVolume: number;
    totalReps: number;
    maxReps: number;
    setsCount: number;
    sets: Array<{
      weight: number;
      reps: number;
      notes?: string;
    }>;
  }>;
  personalRecord: PersonalRecord;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Exercises: undefined;
  WorkoutDetail: { workoutId?: string };
  ExerciseDetail: { exerciseId: string };
  AddExercise: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Exercises: undefined;
};