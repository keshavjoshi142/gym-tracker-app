import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, ExerciseProgress } from '@/types';
import { StorageService } from '@/utils/storage';
import { formatDate } from '@/utils/helpers';

type ExerciseDetailScreenRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;

const { width: screenWidth } = Dimensions.get('window');

const ExerciseDetailScreen: React.FC = () => {
  const route = useRoute<ExerciseDetailScreenRouteProp>();
  const { exerciseId } = route.params;

  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWorkoutIndex, setExpandedWorkoutIndex] = useState<number | null>(null);
  const [chartHeight, setChartHeight] = useState(220);

  useEffect(() => {
    loadExerciseProgress();
  }, [exerciseId]);

  const loadExerciseProgress = async () => {
    try {
      setLoading(true);
      const progress = await StorageService.getExerciseProgress(exerciseId);
      setExerciseProgress(progress);
    } catch (error) {
      console.error('Error loading exercise progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressChart = () => {
    console.log('Exercise progress data:', exerciseProgress);
    console.log('Workouts count:', exerciseProgress?.workouts?.length);
    
    if (!exerciseProgress || exerciseProgress.workouts.length === 0) {
      return (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Progress Chart</Title>
            <View style={styles.noChartContainer}>
              <Icon name="show-chart" size={48} color="#ccc" />
              <Text style={styles.noChartText}>
                No workout data available for this exercise
              </Text>
              <Text style={styles.noChartSubtext}>
                Complete workouts with this exercise to see progress
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    if (exerciseProgress.workouts.length === 1) {
      const workout = exerciseProgress.workouts[0];
      return (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Progress Chart</Title>
            <View style={styles.singleWorkoutContainer}>
              <Icon name="timeline" size={48} color="#6750A4" />
              <Text style={styles.singleWorkoutText}>
                First workout completed!
              </Text>
              <Text style={styles.singleWorkoutSubtext}>
                Max weight: {workout.maxWeight} lbs
              </Text>
              <Text style={styles.singleWorkoutSubtext}>
                Complete another workout to see your progress chart
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    // Filter out workouts with zero weight to avoid chart issues
    const validWorkouts = exerciseProgress.workouts.filter(w => w.maxWeight > 0);
    
    if (validWorkouts.length < 2) {
      return (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Progress Chart</Title>
            <View style={styles.noChartContainer}>
              <Icon name="show-chart" size={48} color="#ccc" />
              <Text style={styles.noChartText}>
                Need workouts with weight data to show progress chart
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    // Show multiple data series for better visualization
    const recentWorkouts = validWorkouts.slice(-6);
    const chartData = {
      labels: recentWorkouts.map(w => {
        const date = new Date(w.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: recentWorkouts.map(w => w.maxWeight),
          color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
          strokeWidth: 3,
          withDots: true,
        },
        {
          data: recentWorkouts.map(w => w.avgWeight),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
          withDots: true,
        },
      ],
      legend: ['Max Weight', 'Avg Weight'],
    };

    const handleDataPointClick = (data: any) => {
      const { index } = data;
      if (expandedWorkoutIndex === index) {
        // Collapse if same point clicked
        setExpandedWorkoutIndex(null);
        setChartHeight(240);
      } else {
        // Expand new workout
        setExpandedWorkoutIndex(index);
        setChartHeight(350);
      }
    };

    console.log('Chart data:', chartData);

    const hasExpandedView = expandedWorkoutIndex !== null;
    const expandedWorkout = hasExpandedView ? recentWorkouts[expandedWorkoutIndex] : null;

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.chartTitle}>Weight Progress</Title>
          <Text style={styles.chartSubtitle}>
            Last {Math.min(validWorkouts.length, 6)} workouts
            {hasExpandedView ? ' • Tap same point to collapse' : ' • Tap dots to expand sets'}
          </Text>
          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={chartHeight}
            onDataPointClick={handleDataPointClick}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: hasExpandedView ? '6' : '4',
                strokeWidth: '2',
                stroke: '#fff',
              },
            }}
            bezier={true}
            style={styles.chart}
            withHorizontalLabels={true}
          />
          
          {hasExpandedView && expandedWorkout && (
            <View style={styles.expandedSetsView}>
              <Text style={styles.expandedTitle}>
                Workout Details - {new Date(expandedWorkout.date).toLocaleDateString()}
              </Text>
              <ScrollView horizontal style={styles.setsScrollView} showsHorizontalScrollIndicator={false}>
                {(expandedWorkout.sets || []).map((set: any, index: number) => (
                  <View key={index} style={styles.setCard}>
                    <Text style={styles.setNumber}>Set {index + 1}</Text>
                    <Text style={styles.setWeight}>{set.weight} lbs</Text>
                    <Text style={styles.setReps}>{set.reps} reps</Text>
                    {set.notes && <Text style={styles.setNotes}>{set.notes}</Text>}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderPersonalRecords = () => {
    if (!exerciseProgress) return null;

    const { personalRecord } = exerciseProgress;

    return (
      <Card style={styles.recordsCard}>
        <Card.Content>
          <View style={styles.recordsHeader}>
            <Icon name="emoji-events" size={24} color="#FFD700" />
            <Title style={styles.recordsTitle}>Personal Records</Title>
          </View>

          <View style={styles.recordsGrid}>
            <View style={styles.recordItem}>
              <Text style={styles.recordValue}>{personalRecord.maxWeight}</Text>
              <Text style={styles.recordLabel}>Max Weight (lbs)</Text>
            </View>

            <View style={styles.recordItem}>
              <Text style={styles.recordValue}>{personalRecord.maxReps}</Text>
              <Text style={styles.recordLabel}>Max Reps</Text>
            </View>

            <View style={styles.recordItem}>
              <Text style={styles.recordValue}>{personalRecord.maxVolume}</Text>
              <Text style={styles.recordLabel}>Best Volume (lbs)</Text>
            </View>
          </View>

          <Text style={styles.recordDate}>
            Last PR set on {formatDate(personalRecord.date)}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderRecentWorkouts = () => {
    if (!exerciseProgress || exerciseProgress.workouts.length === 0) {
      return (
        <Card style={styles.workoutsCard}>
          <Card.Content>
            <Title>Recent Workouts</Title>
            <Text style={styles.noWorkoutsText}>No workout data available</Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.workoutsCard}>
        <Card.Content>
          <Title>Recent Workouts</Title>
          
          {exerciseProgress.workouts.slice(-5).reverse().map((workout, index) => (
            <View key={index} style={styles.workoutItem}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                  <View style={styles.workoutStats}>
                    <Text style={styles.workoutStat}>
                      Max: {workout.maxWeight} lbs
                    </Text>
                    <Text style={styles.workoutStat}>•</Text>
                    <Text style={styles.workoutStat}>
                      Avg: {Math.round(workout.avgWeight)} lbs
                    </Text>
                    <Text style={styles.workoutStat}>•</Text>
                    <Text style={styles.workoutStat}>
                      Volume: {workout.totalVolume} lbs
                    </Text>
                  </View>
                </View>
                
                <View style={styles.workoutProgress}>
                  <Icon
                    name={
                      workout.maxWeight === exerciseProgress.personalRecord.maxWeight
                        ? 'emoji-events'
                        : 'trending-up'
                    }
                    size={20}
                    color={
                      workout.maxWeight === exerciseProgress.personalRecord.maxWeight
                        ? '#FFD700'
                        : '#4CAF50'
                    }
                  />
                </View>
              </View>
              
              {/* Show all sets */}
              <View style={styles.setsContainer}>
                <Text style={styles.setsTitle}>Sets:</Text>
                <View style={styles.setsGrid}>
                  {workout.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setItem}>
                      <Text style={styles.setText}>
                        {set.weight} lbs × {set.reps}
                      </Text>
                      {set.notes && (
                        <Text style={styles.setNotes} numberOfLines={1}>
                          {set.notes}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderStats = () => {
    if (!exerciseProgress) return null;

    const totalWorkouts = exerciseProgress.workouts.length;
    const totalVolume = exerciseProgress.workouts.reduce(
      (sum, workout) => sum + workout.totalVolume, 0
    );
    const totalSets = exerciseProgress.workouts.reduce(
      (sum, workout) => sum + workout.setsCount, 0
    );
    const totalReps = exerciseProgress.workouts.reduce(
      (sum, workout) => sum + workout.totalReps, 0
    );
    const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;

    return (
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="fitness-center" size={24} color="#6750A4" />
            <Text style={styles.statNumber}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="repeat" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>{totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="show-chart" size={24} color="#FF9800" />
            <Text style={styles.statNumber}>{totalReps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading exercise progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exerciseProgress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Exercise not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Title style={styles.exerciseTitle}>{exerciseProgress.exerciseName}</Title>
          <Text style={styles.subtitle}>Track your progress over time</Text>
        </View>

        {renderStats()}
        {renderPersonalRecords()}
        {renderProgressChart()}
        {renderRecentWorkouts()}
      </ScrollView>
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
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  recordsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  recordsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  recordItem: {
    alignItems: 'center',
    flex: 1,
  },
  recordValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chartCard: {
    marginBottom: 20,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noChartText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  noChartSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  singleWorkoutContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  singleWorkoutText: {
    fontSize: 16,
    color: '#6750A4',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  singleWorkoutSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  workoutsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  workoutItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  setsContainer: {
    marginTop: 8,
  },
  setsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setItem: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  setText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  workoutSetNotes: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutStat: {
    fontSize: 12,
    color: '#666',
  },
  workoutProgress: {
    marginLeft: 10,
  },
  noWorkoutsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  expandedSetsView: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750A4',
    marginBottom: 15,
    textAlign: 'center',
  },
  setsScrollView: {
    flexDirection: 'row',
  },
  setCard: {
    backgroundColor: 'white',
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  closeButton: {
    padding: 5,
    borderRadius: 20,
  },
  workoutSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  divider: {
    marginVertical: 15,
  },
  setNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  setNumberText: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: 'bold',
  },
  setDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  setWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  setReps: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  setNotes: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  setVolume: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  setVolumeText: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: 'bold',
  },
});

export default ExerciseDetailScreen;