import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  TextInput,
  Button,
  Chip,
  HelperText,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, Exercise } from '@/types';
import { StorageService } from '@/utils/storage';
import { generateId } from '@/utils/helpers';
import { EXERCISE_CATEGORIES } from '@/data/exercises';

type AddExerciseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExercise'>;

const AddExerciseScreen: React.FC = () => {
  const navigation = useNavigation<AddExerciseScreenNavigationProp>();

  const [exerciseName, setExerciseName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Common muscle groups for suggestions
  const commonMuscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Abs', 'Obliques', 'Core', 'Quadriceps', 'Hamstrings', 'Glutes',
    'Calves', 'Lats', 'Rhomboids', 'Traps', 'Lower Back', 'Upper Chest',
    'Side Delts', 'Rear Delts', 'Middle Traps'
  ];

  const addMuscleGroup = () => {
    if (newMuscleGroup.trim() && !muscleGroups.includes(newMuscleGroup.trim())) {
      setMuscleGroups([...muscleGroups, newMuscleGroup.trim()]);
      setNewMuscleGroup('');
    }
  };

  const removeMuscleGroup = (muscleToRemove: string) => {
    setMuscleGroups(muscleGroups.filter(muscle => muscle !== muscleToRemove));
  };

  const addSuggestedMuscleGroup = (muscle: string) => {
    if (!muscleGroups.includes(muscle)) {
      setMuscleGroups([...muscleGroups, muscle]);
    }
  };

  const validateForm = (): boolean => {
    if (!exerciseName.trim()) {
      Alert.alert('Validation Error', 'Exercise name is required');
      return false;
    }

    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }

    if (muscleGroups.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one muscle group');
      return false;
    }

    return true;
  };

  const saveExercise = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const newExercise: Exercise = {
        id: generateId(),
        name: exerciseName.trim(),
        category: selectedCategory,
        muscleGroups,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
      };

      await StorageService.addExercise(newExercise);

      Alert.alert(
        'Exercise Added!',
        `${exerciseName} has been added to your exercise library.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategorySelection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Category *</Title>
        <View style={styles.categoryContainer}>
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
      </Card.Content>
    </Card>
  );

  const renderMuscleGroupsSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Muscle Groups *</Title>
        
        {/* Selected muscle groups */}
        {muscleGroups.length > 0 && (
          <View style={styles.selectedMusclesContainer}>
            <Text style={styles.selectedMusclesTitle}>Selected:</Text>
            <View style={styles.selectedMuscles}>
              {muscleGroups.map((muscle) => (
                <Chip
                  key={muscle}
                  mode="flat"
                  onClose={() => removeMuscleGroup(muscle)}
                  style={styles.selectedMuscleChip}
                >
                  {muscle}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Add custom muscle group */}
        <View style={styles.addMuscleContainer}>
          <TextInput
            mode="outlined"
            label="Add muscle group"
            value={newMuscleGroup}
            onChangeText={setNewMuscleGroup}
            onSubmitEditing={addMuscleGroup}
            style={styles.muscleInput}
            right={
              <TextInput.Icon
                icon="plus"
                onPress={addMuscleGroup}
                disabled={!newMuscleGroup.trim()}
              />
            }
          />
        </View>

        {/* Suggested muscle groups */}
        <Text style={styles.suggestionsTitle}>Suggestions:</Text>
        <View style={styles.suggestedMuscles}>
          {commonMuscleGroups
            .filter(muscle => !muscleGroups.includes(muscle))
            .map((muscle) => (
              <TouchableOpacity
                key={muscle}
                style={styles.suggestedMuscleChip}
                onPress={() => addSuggestedMuscleGroup(muscle)}
              >
                <Text style={styles.suggestedMuscleText}>{muscle}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Title style={styles.title}>Add New Exercise</Title>
          <Text style={styles.subtitle}>Create a custom exercise for your workouts</Text>
        </View>

        {/* Exercise Name */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Exercise Name *"
              value={exerciseName}
              onChangeText={setExerciseName}
              style={styles.input}
              error={!exerciseName.trim()}
            />
            <HelperText type="info">
              Enter a clear, descriptive name for the exercise
            </HelperText>
          </Card.Content>
        </Card>

        {renderCategorySelection()}
        {renderMuscleGroupsSection()}

        {/* Description */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            <HelperText type="info">
              Brief description of the exercise
            </HelperText>
          </Card.Content>
        </Card>

        {/* Instructions */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Instructions (Optional)"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <HelperText type="info">
              Step-by-step instructions for proper form
            </HelperText>
          </Card.Content>
        </Card>

        {/* Save Button */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={saveExercise}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            Add Exercise
          </Button>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    marginBottom: 5,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6750A4',
    backgroundColor: 'transparent',
  },
  selectedCategoryChip: {
    backgroundColor: '#6750A4',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  selectedMusclesContainer: {
    marginBottom: 15,
  },
  selectedMusclesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  selectedMuscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedMuscleChip: {
    backgroundColor: '#e8f5e8',
  },
  addMuscleContainer: {
    marginBottom: 15,
  },
  muscleInput: {
    marginBottom: 5,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  suggestedMuscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedMuscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  suggestedMuscleText: {
    fontSize: 12,
    color: '#666',
  },
  actionContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#6750A4',
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});

export default AddExerciseScreen;