import axios from 'axios';

const DEFAULT_RADIUS_METERS = 800;

export async function getNearestBuses(lat, lng, radiusMeters = DEFAULT_RADIUS_METERS) {
  // Placeholder: attempt to use a GTFS-RT positions feed if provided, else return mock
  const feedUrl = process.env.GTFS_VEHICLE_POSITIONS_URL;
  if (!feedUrl) {
    // Mock response
    return {
      radiusMeters,
      center: { lat, lng },
      vehicles: [
        { id: 'bus_101', lat: lat + 0.002, lng: lng + 0.002, route: '10A', heading: 90, speedKph: 28 },
        { id: 'bus_205', lat: lat - 0.001, lng: lng - 0.0015, route: '22B', heading: 180, speedKph: 22 }
      ]
    };
  }

  // If a REST provider exists, call it. Here we assume a provider returning { vehicles: [{id, lat, lng, route, speedKph, heading}] }
  try {
    const { data } = await axios.get(feedUrl, { params: { lat, lng, radius: radiusMeters } });
    return data;
  } catch (error) {
    console.error('getNearestBuses error', error.message);
    return { radiusMeters, center: { lat, lng }, vehicles: [] };
  }
}

export async function getTrafficForRoute({ fromLat, fromLng, toLat, toLng }) {
  // Integrate with a traffic API if provided (e.g., Mapbox, Google). Otherwise, mock.
  const trafficUrl = process.env.TRAFFIC_API_URL;
  if (!trafficUrl) {
    return {
      congestionLevel: 'moderate',
      incidentCount: 1,
      incidents: [{ id: 'inc_1', description: 'Minor congestion near Main St', severity: 'low' }]
    };
  }
  try {
    const { data } = await axios.get(trafficUrl, { params: { fromLat, fromLng, toLat, toLng } });
    return data;
  } catch (err) {
    console.error('getTrafficForRoute error', err.message);
    return { congestionLevel: 'unknown', incidentCount: 0, incidents: [] };
  }
}

export async function getETAForRoute({ fromLat, fromLng, toLat, toLng }) {
  const routingUrl = process.env.ROUTING_API_URL; // e.g., Mapbox Directions or OpenRouteService
  if (!routingUrl) {
    // Simple haversine + average speed heuristic
    const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
    const avgSpeedKph = 25; // bus in city
    const etaMinutes = Math.round((distanceKm / avgSpeedKph) * 60);
    return { distanceKm, etaMinutes };
  }
  try {
    const { data } = await axios.get(routingUrl, { params: { fromLat, fromLng, toLat, toLng } });
    return data;
  } catch (err) {
    console.error('getETAForRoute error', err.message);
    return { distanceKm: null, etaMinutes: null };
  }
}

export function subscribeToLiveVehicles(io, { feedUrl }) {
  // In a real implementation, poll GTFS-RT or subscribe to a stream and emit to clients
  let isActive = true;
  const intervalMs = 5000;
  const timer = setInterval(async () => {
    if (!isActive) return;
    try {
      const lat = 40.7128; // sample center
      const lng = -74.0060;
      const data = await getNearestBuses(lat, lng);
      io.emit('vehicles:update', data.vehicles);
    } catch (err) {
      console.error('subscribeToLiveVehicles err', err.message);
    }
  }, intervalMs);

  return () => {
    isActive = false;
    clearInterval(timer);
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}