# GymTracker React Native App - AI Coding Instructions

## Architecture Overview

This is a React Native + Expo fitness tracking app with TypeScript. The app uses a **dual navigation pattern**:
- Bottom tabs for main screens (Home, Workouts, Progress, Exercises)  
- Stack navigation for detail screens (WorkoutDetail, ExerciseDetail, AddExercise)

Key architectural decisions:
- **Pure client-side storage** using AsyncStorage (no backend)
- **Static service pattern** via `StorageService` class for data persistence
- **Material Design** UI with react-native-paper components
- **Type-safe navigation** using strongly-typed param lists

## Project Structure & Import Patterns

```
src/
├── screens/        # All screen components
├── types/          # TypeScript interfaces (centralized in index.ts)
├── data/           # Static data (DEFAULT_EXERCISES)
└── utils/          # Storage service & helper functions
```

**Critical**: Always use the `@/` path alias for imports:
```tsx
import { StorageService } from '@/utils/storage';
import { Exercise, Workout } from '@/types';
import HomeScreen from '@/screens/HomeScreen';
```

## Data Flow & State Management

**No Redux/Context** - Uses local component state + AsyncStorage persistence:

1. **Data Loading Pattern**: Use `useFocusEffect` for screen data refresh
```tsx
useFocusEffect(
  React.useCallback(() => {
    loadData();
  }, [])
);
```

2. **Storage Operations**: Always use `StorageService` static methods
```tsx
const exercises = await StorageService.getExercises();
await StorageService.saveWorkout(workout);
```

3. **ID Generation**: Use `generateId()` helper for all new entities
```tsx
const newWorkout: Workout = {
  id: generateId(),
  date: new Date().toISOString(),
  // ...
};
```

## Core Data Model

**Nested relationship structure**:
- `Workout` → `WorkoutExercise[]` → `WorkoutSet[]`
- Each `WorkoutExercise` embeds the full `Exercise` object (not just ID)
- Personal records auto-calculated on workout save

**Key interfaces**:
- `Exercise`: Base exercise definition with categories/muscle groups
- `Workout`: Contains exercises with sets and metadata
- `WorkoutSet`: Individual set with weight/reps/notes
- `PersonalRecord`: Auto-maintained maxes per exercise

## Development Workflows

**Start development server**:
```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
```

**Key dependencies**:
- Navigation: `@react-navigation/native` + bottom-tabs + native-stack
- UI: `react-native-paper` (Material Design)
- Icons: `react-native-vector-icons/MaterialIcons`
- Charts: `react-native-chart-kit` (for progress visualization)
- Storage: `@react-native-async-storage/async-storage`

## UI Patterns & Conventions

**Screen structure**: Always wrap in `SafeAreaView` + `ScrollView`
```tsx
<SafeAreaView style={styles.container}>
  <ScrollView contentContainerStyle={styles.content}>
    {/* Screen content */}
  </ScrollView>
</SafeAreaView>
```

**Navigation patterns**:
```tsx
// Type-safe navigation
type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScreenName'>;
const navigation = useNavigation<ScreenNavigationProp>();

// Navigate with params
navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
```

**Material Design components**: Use react-native-paper consistently
- `Card` for grouped content
- `FAB` for primary actions
- `TextInput` for forms
- `Button` for actions
- `Chip` for tags/categories

## Code Style & Conventions

**TypeScript**: Strict mode enabled, always type component props and navigation
**Formatting**: Component names use PascalCase, files use PascalCase
**Error handling**: Use try-catch for async operations, console.error for logging
**Colors**: Primary theme uses `#6750A4` (Material Purple)

## Common Operations

**Adding new exercises**: Use `EXERCISE_CATEGORIES` from data/exercises.ts
**Workout calculations**: Use helpers from `@/utils/helpers` (calculateWorkoutStats, etc.)
**Date formatting**: Use `formatDate()` and `isToday()` helpers
**Form validation**: Implement client-side validation with Alert.alert for errors

## Integration Points

**AsyncStorage keys** are centralized in `StorageService.STORAGE_KEYS`
**Default data** initialization happens in `StorageService.getExercises()`
**Charts/Progress** use react-native-chart-kit with data from storage service
**Icons** use MaterialIcons with specific icon names per screen (see TabNavigator)