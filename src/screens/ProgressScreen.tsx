import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, Exercise, PersonalRecord } from '@/types';
import { StorageService } from '@/utils/storage';
import { filterExercises, formatDate } from '@/utils/helpers';

type ProgressScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ExerciseWithProgress extends Exercise {
  personalRecord?: PersonalRecord;
  recentWorkouts?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<ProgressScreenNavigationProp>();
  const [exercises, setExercises] = useState<ExerciseWithProgress[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const [allExercises, workouts, records] = await Promise.all([
        StorageService.getExercises(),
        StorageService.getWorkouts(),
        StorageService.getPersonalRecords(),
      ]);

      setPersonalRecords(records);

      // Combine exercise data with progress information
      const exercisesWithProgress: ExerciseWithProgress[] = allExercises.map(exercise => {
        const personalRecord = records.find(pr => pr.exerciseId === exercise.id);
        
        // Count recent workouts (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentWorkouts = workouts.filter(workout => 
          new Date(workout.date) >= thirtyDaysAgo &&
          workout.exercises.some(we => we.exerciseId === exercise.id)
        ).length;

        return {
          ...exercise,
          personalRecord,
          recentWorkouts,
        };
      });

      // Sort by exercises with progress first, then by recent activity
      const sortedExercises = exercisesWithProgress.sort((a, b) => {
        if (a.personalRecord && !b.personalRecord) return -1;
        if (!a.personalRecord && b.personalRecord) return 1;
        return (b.recentWorkouts || 0) - (a.recentWorkouts || 0);
      });

      setExercises(sortedExercises);
      setFilteredExercises(sortedExercises);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProgressData();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = filterExercises(exercises, searchQuery);
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [exercises, searchQuery]);

  const viewExerciseDetail = (exerciseId: string) => {
    navigation.navigate('ExerciseDetail', { exerciseId });
  };

  const renderProgressCard = ({ item }: { item: ExerciseWithProgress }) => (
    <TouchableOpacity onPress={() => viewExerciseDetail(item.id)}>
      <Card style={styles.progressCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.exerciseInfo}>
              <Title style={styles.exerciseName}>{item.name}</Title>
              <Paragraph style={styles.exerciseCategory}>{item.category}</Paragraph>
            </View>
            
            <View style={styles.progressBadge}>
              {item.personalRecord ? (
                <Icon name="emoji-events" size={20} color="#FFD700" />
              ) : (
                <Icon name="trending-flat" size={20} color="#ccc" />
              )}
            </View>
          </View>

          {item.personalRecord ? (
            <View style={styles.recordsContainer}>
              <View style={styles.recordItem}>
                <Text style={styles.recordLabel}>Max Weight</Text>
                <Text style={styles.recordValue}>{item.personalRecord.maxWeight} lbs</Text>
              </View>
              
              <View style={styles.recordItem}>
                <Text style={styles.recordLabel}>Max Reps</Text>
                <Text style={styles.recordValue}>{item.personalRecord.maxReps}</Text>
              </View>
              
              <View style={styles.recordItem}>
                <Text style={styles.recordLabel}>Best Volume</Text>
                <Text style={styles.recordValue}>{item.personalRecord.maxVolume} lbs</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No progress data yet</Text>
              <Text style={styles.noDataSubtext}>Complete workouts to track progress</Text>
            </View>
          )}

          <View style={styles.activityContainer}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.activityText}>
              {item.recentWorkouts || 0} workout{(item.recentWorkouts || 0) !== 1 ? 's' : ''} this month
            </Text>
            
            {item.personalRecord && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.lastRecordText}>
                  Last PR: {formatDate(item.personalRecord.date)}
                </Text>
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderOverallStats = () => {
    const totalPRs = personalRecords.length;
    const thisMonthPRs = personalRecords.filter(pr => {
      const prDate = new Date(pr.date);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return prDate >= thisMonth;
    }).length;

    const totalVolume = personalRecords.reduce((sum, pr) => sum + pr.maxVolume, 0);

    return (
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="emoji-events" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{totalPRs}</Text>
            <Text style={styles.statLabel}>Total PRs</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{thisMonthPRs}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="fitness-center" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>{totalVolume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Best Volume</Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="trending-up" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Progress Data</Text>
      <Text style={styles.emptySubtitle}>
        Complete some workouts to start tracking your progress!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Progress Tracking</Title>
        <Text style={styles.subtitle}>Monitor your fitness journey</Text>
      </View>

      {renderOverallStats()}

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search exercises..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredExercises}
        renderItem={renderProgressCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadProgressData}
        showsVerticalScrollIndicator={false}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    elevation: 2,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  progressCard: {
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '500',
  },
  progressBadge: {
    padding: 8,
  },
  recordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  recordItem: {
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  recordValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 2,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  activityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  separator: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 10,
  },
  lastRecordText: {
    fontSize: 12,
    color: '#666',
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
});

export default ProgressScreen;