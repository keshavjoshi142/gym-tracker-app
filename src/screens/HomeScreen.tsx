import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, BottomTabParamList, Workout, PersonalRecord } from '@/types';
import { StorageService } from '@/utils/storage';
import { formatDate, isToday, generateId } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<BottomTabParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [weekStats, setWeekStats] = useState({
    workoutsThisWeek: 0,
    totalVolume: 0,
  });

  const loadData = async () => {
    try {
      const workouts = await StorageService.getWorkouts();
      const records = await StorageService.getPersonalRecords();

      // Get recent workouts (last 5)
      const sortedWorkouts = workouts
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setRecentWorkouts(sortedWorkouts);
      setPersonalRecords(records);

      // Calculate week stats
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      
      const thisWeekWorkouts = workouts.filter(workout => 
        new Date(workout.date) >= weekStart
      );

      const totalVolume = thisWeekWorkouts.reduce((sum, workout) => 
        sum + workout.exercises.reduce((workoutSum, exercise) => 
          workoutSum + exercise.sets.reduce((exerciseSum, set) => 
            exerciseSum + (set.weight * set.reps), 0), 0), 0);

      setWeekStats({
        workoutsThisWeek: thisWeekWorkouts.length,
        totalVolume,
      });
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Title style={styles.title}>Gym Tracker</Title>
              <Text style={styles.subtitle}>
                Welcome back{user ? `, ${user.username}` : ''}! Let's crush today's workout 💪
              </Text>
            </View>
            <IconButton
              icon="account-circle"
              size={32}
              onPress={() => {
                // Navigate to Profile screen using parent navigation
                (navigation as any).navigate('Profile');
              }}
              iconColor="#6750A4"
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="fitness-center" size={24} color="#6750A4" />
              <Text style={styles.statNumber}>{weekStats.workoutsThisWeek}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="trending-up" size={24} color="#6750A4" />
              <Text style={styles.statNumber}>{weekStats.totalVolume.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Volume</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="emoji-events" size={24} color="#6750A4" />
              <Text style={styles.statNumber}>{personalRecords.length}</Text>
              <Text style={styles.statLabel}>PRs Set</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recent Workouts</Title>
            <TouchableOpacity onPress={() => navigation.navigate('Workouts')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentWorkouts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No workouts yet</Text>
                <Text style={styles.emptySubtext}>Start your first workout!</Text>
              </Card.Content>
            </Card>
          ) : (
            recentWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                onPress={() => viewWorkout(workout.id)}
              >
                <Card style={styles.workoutCard}>
                  <Card.Content>
                    <View style={styles.workoutHeader}>
                      <View>
                        <Title style={styles.workoutTitle}>
                          {workout.name || `${workout.exercises.length} exercises`}
                        </Title>
                        <Paragraph style={styles.workoutDate}>
                          {formatDate(workout.date)}
                          {isToday(workout.date) && (
                            <Text style={styles.todayBadge}> • Today</Text>
                          )}
                        </Paragraph>
                      </View>
                      <Icon name="chevron-right" size={24} color="#666" />
                    </View>
                    
                    <View style={styles.workoutStats}>
                      <Text style={styles.workoutStat}>
                        {workout.exercises.length} exercises
                      </Text>
                      <Text style={styles.workoutStat}>
                        {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                      </Text>
                      {workout.duration && (
                        <Text style={styles.workoutStat}>
                          {Math.round(workout.duration)}min
                        </Text>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recent PRs</Title>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {personalRecords.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No personal records yet</Text>
                <Text style={styles.emptySubtext}>Complete workouts to set PRs!</Text>
              </Card.Content>
            </Card>
          ) : (
            personalRecords.slice(0, 3).map((record) => (
              <Card key={record.exerciseId} style={styles.recordCard}>
                <Card.Content>
                  <View style={styles.recordHeader}>
                    <Icon name="emoji-events" size={20} color="#FFD700" />
                    <Text style={styles.recordTitle}>Personal Record</Text>
                  </View>
                  <Text style={styles.recordExercise}>Exercise ID: {record.exerciseId}</Text>
                  <Text style={styles.recordDetails}>
                    {record.maxWeight}lbs × {record.maxReps} reps
                  </Text>
                  <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Start Workout"
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
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#6750A4',
    fontWeight: '500',
  },
  workoutCard: {
    marginBottom: 10,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    gap: 15,
  },
  workoutStat: {
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  recordCard: {
    marginBottom: 10,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  recordTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 5,
  },
  recordExercise: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  recordDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6750A4',
  },
});

export default HomeScreen;