import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Chip, FAB, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, Exercise } from '@/types';
import { StorageService } from '@/utils/storage';
import { filterExercises } from '@/utils/helpers';
import { EXERCISE_CATEGORIES } from '@/data/exercises';

type ExercisesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExercisesScreen: React.FC = () => {
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const allExercises = await StorageService.getExercises();
      setExercises(allExercises);
      setFilteredExercises(allExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadExercises();
    }, [])
  );

  useEffect(() => {
    let filtered = exercises;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filterExercises(filtered, searchQuery);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    setFilteredExercises(filtered);
  }, [exercises, searchQuery, selectedCategory]);

  const viewExerciseProgress = (exerciseId: string) => {
    navigation.navigate('ExerciseDetail', { exerciseId });
  };

  const addNewExercise = () => {
    navigation.navigate('AddExercise');
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity onPress={() => viewExerciseProgress(item.id)}>
      <Card style={styles.exerciseCard}>
        <Card.Content>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseInfo}>
              <Title style={styles.exerciseName}>{item.name}</Title>
              <Paragraph style={styles.exerciseCategory}>{item.category}</Paragraph>
            </View>
            <Icon name="chevron-right" size={24} color="#666" />
          </View>

          {item.description && (
            <Paragraph style={styles.exerciseDescription} numberOfLines={2}>
              {item.description}
            </Paragraph>
          )}

          <View style={styles.muscleGroups}>
            {item.muscleGroups.map((muscle, index) => (
              <Chip
                key={index}
                mode="outlined"
                compact
                style={styles.muscleChip}
                textStyle={styles.muscleChipText}
              >
                {muscle}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={[
          styles.categoryChip,
          !selectedCategory && styles.selectedCategoryChip,
        ]}
        onPress={() => setSelectedCategory('')}
      >
        <Text
          style={[
            styles.categoryChipText,
            !selectedCategory && styles.selectedCategoryChipText,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      {EXERCISE_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryChip,
            selectedCategory === category && styles.selectedCategoryChip,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category && styles.selectedCategoryChipText,
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="search-off" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Exercises Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCategory
          ? 'Try adjusting your search filters'
          : 'Add your first exercise to get started'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Exercises</Title>
        <Text style={styles.subtitle}>
          {filteredExercises.length} of {exercises.length} exercises
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search exercises..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadExercises}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Exercise"
        onPress={addNewExercise}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BB86FC',
    backgroundColor: 'transparent',
  },
  selectedCategoryChip: {
    backgroundColor: '#BB86FC',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#BB86FC',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#121212',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  exerciseCard: {
    marginBottom: 15,
    elevation: 2,
    backgroundColor: '#1E1E1E',
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
    color: '#FFFFFF',
    marginBottom: 5,
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#BB86FC',
    fontWeight: '500',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 15,
    lineHeight: 20,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    height: 24,
    borderColor: '#404040',
    backgroundColor: '#2D2D2D',
  },
  muscleChipText: {
    fontSize: 10,
    color: '#B0B0B0',
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
    color: '#B0B0B0',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
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

export default ExercisesScreen;