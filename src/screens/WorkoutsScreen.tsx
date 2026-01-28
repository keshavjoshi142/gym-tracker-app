import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, FAB, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, Workout } from '@/types';
import { StorageService } from '@/utils/storage';
import { formatDate, isToday, generateId, calculateWorkoutStats } from '@/utils/helpers';

type WorkoutsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WorkoutsScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const allWorkouts = await StorageService.getWorkouts();
      const sortedWorkouts = allWorkouts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sortedWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const startNewWorkout = () => {
    const newWorkout: Workout = {
      id: generateId(),
      date: new Date().toISOString(),
      exercises: [],
    };

    navigation.navigate('WorkoutDetail', { workoutId: newWorkout.id });
  };

  const viewWorkout = (workoutId: string) => {
    navigation.navigate('WorkoutDetail', { workoutId });
  };

  const deleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteWorkout(workoutId);
              await loadWorkouts();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  const renderWorkout = ({ item }: { item: Workout }) => {
    const stats = calculateWorkoutStats(item.exercises);

    return (
      <TouchableOpacity onPress={() => viewWorkout(item.id)}>
        <Card style={styles.workoutCard}>
          <Card.Content>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutInfo}>
                <Title style={styles.workoutTitle}>
                  {item.name || `${item.exercises.length} Exercises`}
                </Title>
                <Paragraph style={styles.workoutDate}>
                  {formatDate(item.date)}
                  {isToday(item.date) && (
                    <Text style={styles.todayBadge}> • Today</Text>
                  )}
                </Paragraph>
              </View>
              
              <View style={styles.workoutActions}>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => deleteWorkout(item.id)}
                  iconColor="#ff5252"
                />
                <Icon name="chevron-right" size={24} color="#666" />
              </View>
            </View>

            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Icon name="fitness-center" size={16} color="#6750A4" />
                <Text style={styles.statText}>{stats.totalExercises} exercises</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="repeat" size={16} color="#6750A4" />
                <Text style={styles.statText}>{stats.totalSets} sets</Text>
              </View>
              
              <View style={styles.statItem}>
                <Icon name="trending-up" size={16} color="#6750A4" />
                <Text style={styles.statText}>{stats.totalVolume.toLocaleString()} lbs</Text>
              </View>
              
              {item.duration && (
                <View style={styles.statItem}>
                  <Icon name="schedule" size={16} color="#6750A4" />
                  <Text style={styles.statText}>{Math.round(item.duration)}min</Text>
                </View>
              )}
            </View>

            {item.exercises.length > 0 && (
              <View style={styles.exercisePreview}>
                <Text style={styles.exercisePreviewTitle}>Exercises:</Text>
                <Text style={styles.exercisePreviewText} numberOfLines={2}>
                  {item.exercises.map(ex => ex.exercise.name).join(', ')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="fitness-center" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your fitness journey by creating your first workout!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>My Workouts</Title>
        <Text style={styles.subtitle}>
          {workouts.length} workout{workouts.length !== 1 ? 's' : ''} completed
        </Text>
      </View>

      <FlatList
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadWorkouts}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Workout"
        onPress={startNewWorkout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  workoutCard: {
    marginBottom: 15,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
  },
  todayBadge: {
    color: '#6750A4',
    fontWeight: 'bold',
  },
  workoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  exercisePreview: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  exercisePreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  exercisePreviewText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 50,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6750A4',
  },
});

export default WorkoutsScreen;