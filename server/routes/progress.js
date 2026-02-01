const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all progress routes
router.use(authenticateToken);

// GET /api/progress/personal-records - Get all personal records for authenticated user
router.get('/personal-records', async (req, res) => {
  try {
    const records = await req.db.getAllPersonalRecords(req.user.userId);
    res.json(records);
  } catch (error) {
    console.error('Error fetching personal records:', error);
    res.status(500).json({ error: 'Failed to fetch personal records' });
  }
});

// GET /api/progress/exercise/:exerciseId - Get exercise progress for authenticated user
router.get('/exercise/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const progress = await req.db.getExerciseProgress(req.user.userId, exerciseId);
    
    if (!progress || progress.workouts.length === 0) {
      return res.status(404).json({ error: 'Exercise progress not found' });
    }
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching exercise progress:', error);
    res.status(500).json({ error: 'Failed to fetch exercise progress' });
  }
});

// POST /api/progress/body-measurements - Add body measurement
router.post('/body-measurements', async (req, res) => {
  try {
    const measurementData = req.body;
    
    if (!measurementData.date) {
      return res.status(400).json({ error: 'Measurement date is required' });
    }
    
    const measurement = await req.db.addBodyMeasurement(req.user.userId, measurementData);
    
    res.status(201).json(measurement);
  } catch (error) {
    console.error('Error adding body measurement:', error);
    res.status(500).json({ error: 'Failed to add body measurement' });
  }
});

// GET /api/progress/body-measurements - Get body measurements for authenticated user
router.get('/body-measurements', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const measurements = await req.db.getBodyMeasurements(
      req.user.userId, 
      startDate, 
      endDate
    );
    
    res.json(measurements);
  } catch (error) {
    console.error('Error fetching body measurements:', error);
    res.status(500).json({ error: 'Failed to fetch body measurements' });
  }
});

module.exports = router;