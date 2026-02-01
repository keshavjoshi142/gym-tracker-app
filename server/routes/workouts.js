const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all workout routes
router.use(authenticateToken);

// GET /api/workouts - Get all workouts for authenticated user
router.get('/', async (req, res) => {
  try {
    const workouts = await req.db.getAllWorkouts(req.user.userId);
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// GET /api/workouts/:id - Get specific workout for authenticated user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workout = await req.db.getWorkoutById(req.user.userId, id);
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// POST /api/workouts - Create new workout for authenticated user
router.post('/', async (req, res) => {
  try {
    const { date, name, exercises, notes, duration, isTemplate } = req.body;
    
    if (!date || !exercises) {
      return res.status(400).json({ error: 'Date and exercises are required' });
    }

    const workout = await req.db.createWorkout(req.user.userId, {
      date,
      name,
      exercises,
      notes,
      duration,
      isTemplate
    });
    
    res.status(201).json(workout);
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// PUT /api/workouts/:id - Update workout for authenticated user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, name, exercises, notes, duration, isTemplate } = req.body;
    
    if (!date || !exercises) {
      return res.status(400).json({ error: 'Date and exercises are required' });
    }

    const workout = await req.db.updateWorkout(req.user.userId, id, {
      date,
      name,
      exercises,
      notes,
      duration,
      isTemplate
    });
    
    res.json(workout);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: 'Workout not found or access denied' });
    }
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// DELETE /api/workouts/:id - Delete workout for authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await req.db.deleteWorkout(req.user.userId, id);
    
    if (!result.success) {
      return res.status(404).json({ error: 'Workout not found or access denied' });
    }
    
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ error: 'Workout not found or access denied' });
    }
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

module.exports = router;