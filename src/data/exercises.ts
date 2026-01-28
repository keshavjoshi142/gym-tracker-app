import { Exercise } from '@/types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    description: 'Classic chest exercise using a barbell',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: 'Chest',
    muscleGroups: ['Upper Chest', 'Shoulders', 'Triceps'],
    description: 'Targets upper chest with inclined bench',
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'Chest',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    description: 'Bodyweight chest exercise',
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    category: 'Chest',
    muscleGroups: ['Chest'],
    description: 'Isolation exercise for chest muscles',
  },

  // Back
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Back',
    muscleGroups: ['Back', 'Glutes', 'Hamstrings', 'Core'],
    description: 'Compound movement targeting entire posterior chain',
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    category: 'Back',
    muscleGroups: ['Lats', 'Rhomboids', 'Biceps'],
    description: 'Bodyweight back exercise',
  },
  {
    id: 'barbell-rows',
    name: 'Barbell Rows',
    category: 'Back',
    muscleGroups: ['Lats', 'Rhomboids', 'Middle Traps'],
    description: 'Compound rowing movement',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    muscleGroups: ['Lats', 'Rhomboids', 'Biceps'],
    description: 'Machine exercise targeting lats',
  },

  // Legs
  {
    id: 'squat',
    name: 'Squat',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    description: 'King of all exercises - compound leg movement',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    description: 'Machine-based leg exercise',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    description: 'Unilateral leg exercise',
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    category: 'Legs',
    muscleGroups: ['Hamstrings'],
    description: 'Isolation exercise for hamstrings',
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'Shoulders',
    muscleGroups: ['Shoulders', 'Triceps', 'Core'],
    description: 'Standing barbell press overhead',
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    category: 'Shoulders',
    muscleGroups: ['Side Delts'],
    description: 'Isolation exercise for side deltoids',
  },
  {
    id: 'shoulder-shrugs',
    name: 'Shoulder Shrugs',
    category: 'Shoulders',
    muscleGroups: ['Traps'],
    description: 'Targets upper trapezius muscles',
  },

  // Arms
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    category: 'Arms',
    muscleGroups: ['Biceps'],
    description: 'Classic bicep isolation exercise',
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    category: 'Arms',
    muscleGroups: ['Triceps'],
    description: 'Bodyweight tricep exercise',
  },
  {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    category: 'Arms',
    muscleGroups: ['Biceps', 'Forearms'],
    description: 'Neutral grip bicep exercise',
  },

  // Core
  {
    id: 'planks',
    name: 'Planks',
    category: 'Core',
    muscleGroups: ['Core', 'Shoulders'],
    description: 'Isometric core strengthening exercise',
  },
  {
    id: 'crunches',
    name: 'Crunches',
    category: 'Core',
    muscleGroups: ['Abs'],
    description: 'Traditional abdominal exercise',
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    category: 'Core',
    muscleGroups: ['Obliques', 'Core'],
    description: 'Rotational core exercise',
  },
];

export const EXERCISE_CATEGORIES = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Other',
];