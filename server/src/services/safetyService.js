import { getTrafficForRoute } from './busService.js';

export async function getSafetyScoreForRoute({ fromLat, fromLng, toLat, toLng, time }) {
  const date = new Date(time);
  const hour = date.getUTCHours();
  const isNight = hour >= 20 || hour <= 5;

  const traffic = await getTrafficForRoute({ fromLat, fromLng, toLat, toLng });
  const incidentPenalty = Math.min(traffic.incidentCount || 0, 5) * 10;

  let score = 100 - incidentPenalty - (isNight ? 15 : 0);
  score = Math.max(0, Math.min(100, score));

  return { score, isNight, traffic };
}