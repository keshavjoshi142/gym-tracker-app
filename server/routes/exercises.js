const express = require('express');
const router = express.Router();

// GET /api/exercises - Get all exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await req.db.getAllExercises();
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// POST /api/exercises - Create new exercise
router.post('/', async (req, res) => {
  try {
    const { name, category, muscleGroups, description } = req.body;
    
    if (!name || !category || !muscleGroups) {
      return res.status(400).json({ error: 'Name, category, and muscle groups are required' });
    }

    const exercise = await req.db.createExercise({
      name,
      category,
      muscleGroups,
      description
    });
    
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

module.exports = router;