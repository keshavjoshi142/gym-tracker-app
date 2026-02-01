import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Button,
  TextInput,
  IconButton,
  FAB,
  Searchbar,
  Chip,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  RootStackParamList,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Exercise,
} from '@/types';
import { StorageService } from '@/utils/storage';
import {
  generateId,
  formatDate,
  calculateWorkoutStats,
  getExerciseMaxes,
  filterExercises,
} from '@/utils/helpers';

type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;
type WorkoutDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutDetail'>;

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const route = useRoute<WorkoutDetailScreenRouteProp>();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [startTime] = useState(new Date());
  const [isNewWorkout, setIsNewWorkout] = useState(false);
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [successAnim] = useState(new Animated.Value(0));
  const [deleteExerciseDialogVisible, setDeleteExerciseDialogVisible] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [deleteWorkoutDialogVisible, setDeleteWorkoutDialogVisible] = useState(false);

  useEffect(() => {
    loadWorkoutData();
    loadExercises();
  }, [workoutId]);

  const loadWorkoutData = async () => {
    try {
      const workouts = await StorageService.getWorkouts();
      const existingWorkout = workouts.find((w: Workout) => w.id === workoutId);

      if (existingWorkout) {
        setWorkout(existingWorkout);
      } else {
        // Create new workout
        const newWorkout: Workout = {
          id: workoutId!,
          date: new Date().toISOString(),
          exercises: [],
        };
        setWorkout(newWorkout);
        setIsNewWorkout(true);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    }
  };

  const loadExercises = async () => {
    try {
      const allExercises = await StorageService.getExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const saveWorkout = async () => {
    if (!workout) return;

    try {
      // Calculate duration if it's a new workout
      let updatedWorkout = { ...workout };
      if (isNewWorkout) {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000); // minutes
        updatedWorkout = { ...workout, duration };
      }

      await StorageService.saveWorkout(updatedWorkout);
      setWorkout(updatedWorkout);
      setIsNewWorkout(false);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const addExerciseToWorkout = async (exercise: Exercise) => {
    if (!workout) return;

    const newWorkoutExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      exercise,
      sets: [],
    };

    const updatedWorkout = {
      ...workout,
      exercises: [...workout.exercises, newWorkoutExercise],
    };

    setWorkout(updatedWorkout);
    
    // Save the updated workout directly
    try {
      await StorageService.saveWorkout(updatedWorkout);
      setIsNewWorkout(false);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to add exercise to workout');
    }
    
    setShowExerciseModal(false);
    setExerciseSearchQuery('');
  };

  const removeExerciseFromWorkout = (exerciseId: string) => {
    console.log('removeExerciseFromWorkout called with ID:', exerciseId);
    console.log('Current workout exercises:', workout?.exercises);
    console.log('Opening delete exercise confirmation dialog...');
    setExerciseToDelete(exerciseId);
    setDeleteExerciseDialogVisible(true);
  };

  const confirmRemoveExercise = async () => {
    if (!workout || !exerciseToDelete) return;
    
    console.log('User confirmed remove exercise:', exerciseToDelete);
    setDeleteExerciseDialogVisible(false);
    
    try {
      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.filter((ex: WorkoutExercise) => ex.id !== exerciseToDelete),
      };
      setWorkout(updatedWorkout);
      
      console.log('Exercise removed, saving workout...');
      await StorageService.saveWorkout(updatedWorkout);
      console.log('Workout saved successfully after exercise removal');
    } catch (error) {
      console.error('Error removing exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise');
    } finally {
      setExerciseToDelete(null);
    }
  };

  const cancelRemoveExercise = () => {
    console.log('User cancelled remove exercise');
    setDeleteExerciseDialogVisible(false);
    setExerciseToDelete(null);
  };

  const deleteWorkout = async () => {
    if (!workout || isNewWorkout) return;

    console.log('Delete workout button pressed');
    setDeleteWorkoutDialogVisible(true);
  };

  const confirmDeleteWorkout = async () => {
    if (!workout) return;
    
    console.log('User confirmed delete workout:', workout.id);
    setDeleteWorkoutDialogVisible(false);
    
    try {
      console.log('Calling StorageService.deleteWorkout...');
      await StorageService.deleteWorkout(workout.id);
      console.log('Workout deleted successfully, navigating back...');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting workout:', error);
      Alert.alert('Error', 'Failed to delete workout');
    }
  };

  const cancelDeleteWorkout = () => {
    console.log('User cancelled delete workout');
    setDeleteWorkoutDialogVisible(false);
  };

  const addSet = async (exerciseId: string) => {
    if (!workout) return;

    const newSet: WorkoutSet = {
      id: generateId(),
      weight: 0,
      reps: 0,
    };

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((ex: WorkoutExercise) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      ),
    };

    setWorkout(updatedWorkout);
    
    // Save the updated workout directly
    try {
      await StorageService.saveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set');
    }
  };

  const updateSet = async (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    if (!workout) return;

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((ex: WorkoutExercise) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set: WorkoutSet) =>
                set.id === setId ? { ...set, ...updates } : set
              ),
            }
          : ex
      ),
    };

    setWorkout(updatedWorkout);
    
    // Save the updated workout directly
    try {
      await StorageService.saveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error updating set:', error);
      Alert.alert('Error', 'Failed to update set');
    }
  };

  const removeSet = async (exerciseId: string, setId: string) => {
    if (!workout) return;

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((ex: WorkoutExercise) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((set: WorkoutSet) => set.id !== setId) }
          : ex
      ),
    };

    setWorkout(updatedWorkout);
    
    // Save the updated workout directly
    try {
      await StorageService.saveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error removing set:', error);
      Alert.alert('Error', 'Failed to remove set');
    }
  };

  const finishWorkout = async () => {
    console.log('finishWorkout called');
    console.log('workout:', workout);
    console.log('workout.exercises.length:', workout?.exercises?.length);
    
    if (!workout || workout.exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise to save the workout.');
      return;
    }

    setIsFinishingWorkout(true);
    
    // Start button animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      console.log('Starting workout save...');
      // Calculate duration if it's a new workout
      let finalWorkout = { ...workout };
      if (isNewWorkout) {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000); // minutes
        finalWorkout = { ...workout, duration };
        console.log('Added duration:', duration);
      }

      console.log('Saving workout to storage...');
      await StorageService.saveWorkout(finalWorkout);
      setWorkout(finalWorkout);
      setIsNewWorkout(false);
      
      console.log('Workout saved successfully!');
      
      // Vibrate for success feedback
      Vibration.vibrate([100, 50, 100]);
      
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Animate success overlay
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessAnimation(false);
      });
      
      // Fade out screen and navigate
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Navigate back to home with workouts tab selected
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Home',
                state: {
                  routes: [
                    { name: 'Home' },
                    { name: 'Workouts' },
                    { name: 'Progress' },
                    { name: 'Exercises' },
                  ],
                  index: 1, // Select Workouts tab (index 1)
                },
              },
            ],
          });
        });
      }, 1800);
      
    } catch (error) {
      console.error('Error finishing workout:', error);
      Alert.alert(
        'Save Failed',
        'There was a problem saving your workout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsFinishingWorkout(false);
    }
  };

  const renderSuccessAnimation = () => {
    if (!showSuccessAnimation) return null;

    return (
      <Animated.View 
        style={[
          styles.successOverlay,
          {
            opacity: successAnim,
            transform: [{
              scale: successAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 1.2, 1],
              })
            }]
          }
        ]}
      >
        <View style={styles.successContent}>
          <Animated.View 
            style={[
              styles.successIcon,
              {
                transform: [{
                  rotate: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }
            ]}
          >
            <Text style={styles.successIconText}>🎉</Text>
          </Animated.View>
          <Text style={styles.successTitle}>Workout Complete!</Text>
          <Text style={styles.successSubtitle}>Great job! Your workout has been saved.</Text>
        </View>
      </Animated.View>
    );
  };

  const renderSet = (set: WorkoutSet, index: number, exerciseId: string) => (
    <View key={set.id} style={styles.setRow}>
      <Text style={styles.setNumber}>{index + 1}</Text>
      
      <TextInput
        mode="outlined"
        label="Weight (lbs)"
        value={set.weight.toString()}
        onChangeText={(text) => {
          const weight = parseFloat(text) || 0;
          updateSet(exerciseId, set.id, { weight });
        }}
        keyboardType="numeric"
        style={styles.setInput}
        dense
      />
      
      <TextInput
        mode="outlined"
        label="Reps"
        value={set.reps.toString()}
        onChangeText={(text) => {
          const reps = parseInt(text) || 0;
          updateSet(exerciseId, set.id, { reps });
        }}
        keyboardType="numeric"
        style={styles.setInput}
        dense
      />
      
      <IconButton
        icon="delete"
        size={20}
        onPress={() => removeSet(exerciseId, set.id)}
        iconColor="#ff5252"
      />
    </View>
  );

  const renderWorkoutExercise = (workoutExercise: WorkoutExercise) => {
    const exerciseMaxes = getExerciseMaxes(workoutExercise.sets);

    return (
      <Card key={workoutExercise.id} style={styles.exerciseCard}>
        <Card.Content>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseInfo}>
              <Title style={styles.exerciseName}>{workoutExercise.exercise?.name || workoutExercise.name || 'Unknown Exercise'}</Title>
              <Text style={styles.exerciseCategory}>{workoutExercise.exercise?.category || workoutExercise.category || 'Unknown'}</Text>
            </View>
            
            <IconButton
              icon="delete"
              size={20}
              onPress={() => removeExerciseFromWorkout(workoutExercise.id)}
              iconColor="#ff5252"
            />
          </View>

          {workoutExercise.sets.length > 0 && (
            <View style={styles.exerciseStats}>
              <Text style={styles.exerciseStat}>Max: {exerciseMaxes.maxWeight} lbs</Text>
              <Text style={styles.exerciseStat}>Best: {exerciseMaxes.maxReps} reps</Text>
              <Text style={styles.exerciseStat}>Volume: {exerciseMaxes.maxVolume} lbs</Text>
            </View>
          )}

          <View style={styles.setsContainer}>
            <View style={styles.setsHeader}>
              <Text style={styles.setsTitle}>Sets</Text>
              <Button
                mode="contained"
                onPress={() => addSet(workoutExercise.id)}
                compact
                style={styles.addSetButton}
              >
                Add Set
              </Button>
            </View>

            {workoutExercise.sets.length === 0 ? (
              <Text style={styles.noSetsText}>No sets added yet</Text>
            ) : (
              workoutExercise.sets.map((set: WorkoutSet, index: number) =>
                renderSet(set, index, workoutExercise.id)
              )
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderExerciseModal = () => {
    const filteredExercises = exerciseSearchQuery
      ? filterExercises(exercises, exerciseSearchQuery)
      : exercises;

    return (
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title>Add Exercise</Title>
            <IconButton
              icon="close"
              onPress={() => {
                setShowExerciseModal(false);
                setExerciseSearchQuery('');
              }}
            />
          </View>

          <View style={styles.modalSearchContainer}>
            <Searchbar
              placeholder="Search exercises..."
              onChangeText={setExerciseSearchQuery}
              value={exerciseSearchQuery}
              style={styles.modalSearchBar}
            />
          </View>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => addExerciseToWorkout(item)}>
                <Card style={styles.modalExerciseCard}>
                  <Card.Content>
                    <Title style={styles.modalExerciseName}>{item.name}</Title>
                    <Text style={styles.modalExerciseCategory}>{item.category}</Text>
                    <View style={styles.modalMuscleGroups}>
                      {item.muscleGroups.map((muscle: string, index: number) => (
                        <Chip key={index} compact mode="outlined" style={styles.modalMuscleChip}>
                          {muscle}
                        </Chip>
                      ))}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const workoutStats = calculateWorkoutStats(workout.exercises);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Title style={styles.workoutTitle}>
              {workout.name || 'Current Workout'}
              {!isNewWorkout && (
                <Text style={styles.completedBadge}> ✓</Text>
              )}
            </Title>
            <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
            {isNewWorkout && (
              <Text style={styles.workoutStatus}>In Progress</Text>
            )}
          </View>
        </View>

        {workout.exercises.length > 0 && (
          <View style={styles.statsContainer}>
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{workoutStats.totalExercises}</Text>
                    <Text style={styles.statLabel}>Exercises</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{workoutStats.totalSets}</Text>
                    <Text style={styles.statLabel}>Sets</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{workoutStats.totalVolume.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Volume</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {workout.exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="fitness-center" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No exercises added yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add exercises</Text>
          </View>
        ) : (
          workout.exercises.map(renderWorkoutExercise)
        )}

        {workout.exercises.length > 0 && (
          <View style={styles.actionContainer}>
            <Animated.View 
              style={{
                transform: [{ scale: scaleAnim }]
              }}
            >
              <Button
                mode="contained"
                onPress={finishWorkout}
                loading={isFinishingWorkout}
                disabled={isFinishingWorkout}
                style={[
                  styles.finishButton,
                  isFinishingWorkout && styles.finishButtonLoading
                ]}
                contentStyle={styles.finishButtonContent}
                icon={isFinishingWorkout ? undefined : "check"}
              >
                {isFinishingWorkout ? 'Saving Workout...' : 'Finish Workout'}
              </Button>
            </Animated.View>

            {!isNewWorkout && (
              <Button
                mode="outlined"
                onPress={deleteWorkout}
                style={styles.deleteButton}
                textColor="#ff5252"
                icon="delete"
              >
                Delete Workout
              </Button>
            )}
            
            {isNewWorkout && (
              <Animated.Text 
                style={[
                  styles.workoutTimer,
                  {
                    opacity: fadeAnim,
                  }
                ]}
              >
                Workout duration: {Math.round((new Date().getTime() - startTime.getTime()) / 60000)} minutes
              </Animated.Text>
            )}
          </View>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Exercise"
        onPress={() => setShowExerciseModal(true)}
      />

      {renderExerciseModal()}
      </Animated.View>
      
      {renderSuccessAnimation()}

      <Portal>
        <Dialog visible={deleteExerciseDialogVisible} onDismiss={cancelRemoveExercise}>
          <Dialog.Title>Remove Exercise</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to remove this exercise from the workout?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelRemoveExercise}>Cancel</Button>
            <Button 
              onPress={confirmRemoveExercise}
              textColor="#ff5252"
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteWorkoutDialogVisible} onDismiss={cancelDeleteWorkout}>
          <Dialog.Title>Delete Workout</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete this workout? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDeleteWorkout}>Cancel</Button>
            <Button 
              onPress={confirmDeleteWorkout}
              textColor="#ff5252"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  animatedContainer: {
    flex: 1,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'column',
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    color: '#4CAF50',
    fontSize: 20,
  },
  workoutStatus: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
  },
  workoutDate: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    elevation: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  exerciseCard: {
    marginBottom: 15,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#6750A4',
    marginTop: 5,
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  exerciseStat: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  setsContainer: {
    marginTop: 10,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSetButton: {
    backgroundColor: '#6750A4',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  setInput: {
    flex: 1,
    height: 40,
  },
  noSetsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
  },
  actionContainer: {
    marginTop: 30,
    marginBottom: 100,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishButtonLoading: {
    backgroundColor: '#81C784',
    elevation: 4,
  },
  finishButtonContent: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 15,
    borderColor: '#ff5252',
    borderWidth: 1,
  },
  workoutTimer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6750A4',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalSearchContainer: {
    padding: 20,
  },
  modalSearchBar: {
    elevation: 2,
  },
  modalList: {
    padding: 20,
  },
  modalExerciseCard: {
    marginBottom: 10,
    elevation: 1,
  },
  modalExerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalExerciseCategory: {
    fontSize: 14,
    color: '#6750A4',
    marginTop: 5,
  },
  modalMuscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  modalMuscleChip: {
    height: 20,
  },
});

export default WorkoutDetailScreen;