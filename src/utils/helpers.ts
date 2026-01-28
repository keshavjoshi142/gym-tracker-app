import { WorkoutSet, WorkoutExercise } from '@/types';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const calculateWorkoutStats = (exercises: WorkoutExercise[]) => {
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const totalVolume = exercises.reduce((sum, exercise) => 
    sum + exercise.sets.reduce((exerciseSum, set) => exerciseSum + (set.weight * set.reps), 0), 0
  );
  
  return {
    totalExercises: exercises.length,
    totalSets,
    totalVolume,
  };
};

export const calculateSetVolume = (set: WorkoutSet): number => {
  return set.weight * set.reps;
};

export const getExerciseMaxes = (sets: WorkoutSet[]) => {
  if (sets.length === 0) {
    return { maxWeight: 0, maxReps: 0, maxVolume: 0 };
  }

  const maxWeight = Math.max(...sets.map(s => s.weight));
  const maxReps = Math.max(...sets.map(s => s.reps));
  const maxVolume = Math.max(...sets.map(s => calculateSetVolume(s)));

  return { maxWeight, maxReps, maxVolume };
};

export const filterExercises = (exercises: any[], searchQuery: string): any[] => {
  if (!searchQuery.trim()) {
    return exercises;
  }

  const query = searchQuery.toLowerCase();
  return exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(query) ||
    exercise.category.toLowerCase().includes(query) ||
    exercise.muscleGroups.some((muscle: string) => 
      muscle.toLowerCase().includes(query)
    )
  );
};

export const getWeekDates = (date: Date = new Date()): Date[] => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day; // First day is Sunday
  startOfWeek.setDate(diff);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    weekDates.push(currentDate);
  }

  return weekDates;
};

export const isToday = (date: string): boolean => {
  const today = new Date().toDateString();
  const compareDate = new Date(date).toDateString();
  return today === compareDate;
};