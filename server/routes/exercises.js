const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/exercises - Get all exercises (public + user's custom exercises if authenticated)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const exercises = await req.db.getAllExercises(userId);
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// POST /api/exercises - Create new custom exercise (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      muscleGroups, 
      description, 
      instructions,
      equipment,
      difficultyLevel,
      isPublic 
    } = req.body;
    
    if (!name || !category || !muscleGroups) {
      return res.status(400).json({ 
        error: 'Name, category, and muscle groups are required' 
      });
    }

    const exercise = await req.db.createCustomExercise(req.user.userId, {
      name,
      category,
      muscleGroups,
      description,
      instructions,
      equipment,
      difficultyLevel,
      isPublic
    });
    
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// POST /api/exercises/:id/favorite - Add exercise to user's favorites
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.db.favoriteExercise(req.user.userId, id);
    
    res.json({ message: 'Exercise added to favorites' });
  } catch (error) {
    console.error('Error favoriting exercise:', error);
    res.status(500).json({ error: 'Failed to favorite exercise' });
  }
});

// DELETE /api/exercises/:id/favorite - Remove exercise from user's favorites
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.db.unfavoriteExercise(req.user.userId, id);
    
    res.json({ message: 'Exercise removed from favorites' });
  } catch (error) {
    console.error('Error unfavoriting exercise:', error);
    res.status(500).json({ error: 'Failed to unfavorite exercise' });
  }
});

module.exports = router;