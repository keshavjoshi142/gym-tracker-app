const express = require('express');
const router = express.Router();

// GET /api/progress/personal-records - Get all personal records
router.get('/personal-records', async (req, res) => {
  try {
    const records = await req.db.getAllPersonalRecords();
    res.json(records);
  } catch (error) {
    console.error('Error fetching personal records:', error);
    res.status(500).json({ error: 'Failed to fetch personal records' });
  }
});

// GET /api/progress/exercise/:exerciseId - Get exercise progress
router.get('/exercise/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const progress = await req.db.getExerciseProgress(exerciseId);
    
    if (!progress) {
      return res.status(404).json({ error: 'Exercise progress not found' });
    }
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching exercise progress:', error);
    res.status(500).json({ error: 'Failed to fetch exercise progress' });
  }
});

module.exports = router;