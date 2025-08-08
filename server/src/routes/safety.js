import express from 'express';
import { getSafetyScoreForRoute } from '../services/safetyService.js';

const router = express.Router();

router.get('/route-score', async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng, time } = req.query;
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng required' });
    }
    const result = await getSafetyScoreForRoute({
      fromLat: Number(fromLat), fromLng: Number(fromLng),
      toLat: Number(toLat), toLng: Number(toLng), time: time || new Date().toISOString()
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute safety score' });
  }
});

export default router;