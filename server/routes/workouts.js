const express = require('express');
const router = express.Router();

// GET /api/workouts - Get all workouts
router.get('/', async (req, res) => {
  try {
    const workouts = await req.db.getAllWorkouts();
    res.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// POST /api/workouts - Create new workout
router.post('/', async (req, res) => {
  try {
    const { date, exercises, notes } = req.body;
    
    if (!date || !exercises) {
      return res.status(400).json({ error: 'Date and exercises are required' });
    }

    const workout = await req.db.createWorkout({
      date,
      exercises,
      notes
    });
    
    res.status(201).json(workout);
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// PUT /api/workouts/:id - Update workout
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, exercises, notes } = req.body;
    
    if (!date || !exercises) {
      return res.status(400).json({ error: 'Date and exercises are required' });
    }

    const workout = await req.db.updateWorkout(id, {
      date,
      exercises,
      notes
    });
    
    res.json(workout);
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// DELETE /api/workouts/:id - Delete workout
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.deleteWorkout(id);
    
    if (result.deleted) {
      res.json({ message: 'Workout deleted successfully' });
    } else {
      res.status(404).json({ error: 'Workout not found' });
    }
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

module.exports = router;