import express from 'express';
import { getNearestBuses, getTrafficForRoute, getETAForRoute, subscribeToLiveVehicles } from '../services/busService.js';

export default function busRouter(io) {
  const router = express.Router();

  router.get('/nearest', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
      const result = await getNearestBuses(Number(lat), Number(lng));
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch nearest buses' });
    }
  });

  router.get('/traffic', async (req, res) => {
    try {
      const { fromLat, fromLng, toLat, toLng } = req.query;
      if (!fromLat || !fromLng || !toLat || !toLng) {
        return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng required' });
      }
      const result = await getTrafficForRoute({ fromLat: Number(fromLat), fromLng: Number(fromLng), toLat: Number(toLat), toLng: Number(toLng) });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch traffic' });
    }
  });

  router.get('/eta', async (req, res) => {
    try {
      const { fromLat, fromLng, toLat, toLng } = req.query;
      if (!fromLat || !fromLng || !toLat || !toLng) {
        return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng required' });
      }
      const result = await getETAForRoute({ fromLat: Number(fromLat), fromLng: Number(fromLng), toLat: Number(toLat), toLng: Number(toLng) });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to compute ETA' });
    }
  });

  // Socket streaming for live vehicles
  router.get('/subscribe', (req, res) => {
    const { feed } = req.query;
    res.json({ status: 'subscribed' });
    subscribeToLiveVehicles(io, { feedUrl: feed });
  });

  return router;
}