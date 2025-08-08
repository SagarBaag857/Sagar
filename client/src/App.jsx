import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import io from 'socket.io-client'
import axios from 'axios'
import polyline from '@mapbox/polyline'
import './assets/leaflet-fix'

const socket = io('/', { path: '/socket.io' })

function useUserLocation() {
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 })
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])
  return location
}

function ClickToSet({ onSelect }) {
  useMapEvents({ click: (e) => onSelect(e.latlng) })
  return null
}

const busIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

export default function App() {
  const userLoc = useUserLocation()
  const [destination, setDestination] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [traffic, setTraffic] = useState(null)
  const [eta, setEta] = useState(null)
  const [safety, setSafety] = useState(null)

  useEffect(() => {
    socket.on('vehicles:update', (data) => setVehicles(data))
    return () => socket.off('vehicles:update')
  }, [])

  useEffect(() => {
    const fetchNearest = async () => {
      const { data } = await axios.get('/api/bus/nearest', { params: userLoc })
      setVehicles(data.vehicles)
    }
    fetchNearest()
  }, [userLoc.lat, userLoc.lng])

  useEffect(() => {
    const fetchPanels = async () => {
      if (!destination) return
      const [trafficRes, etaRes, safetyRes] = await Promise.all([
        axios.get('/api/bus/traffic', { params: { fromLat: userLoc.lat, fromLng: userLoc.lng, toLat: destination.lat, toLng: destination.lng } }),
        axios.get('/api/bus/eta', { params: { fromLat: userLoc.lat, fromLng: userLoc.lng, toLat: destination.lat, toLng: destination.lng } }),
        axios.get('/api/safety/route-score', { params: { fromLat: userLoc.lat, fromLng: userLoc.lng, toLat: destination.lat, toLng: destination.lng } })
      ])
      setTraffic(trafficRes.data)
      setEta(etaRes.data)
      setSafety(safetyRes.data)
    }
    fetchPanels()
  }, [destination, userLoc.lat, userLoc.lng])

  const routeLine = useMemo(() => {
    if (!destination) return null
    // simple straight line. For real routing, decode polyline from API
    return [ [userLoc.lat, userLoc.lng], [destination.lat, destination.lng] ]
  }, [destination, userLoc])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[userLoc.lat, userLoc.lng]} icon={busIcon}>
            <Popup>Your location</Popup>
          </Marker>
          {vehicles.map((v) => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={busIcon}>
              <Popup>
                <div>
                  <div>Bus {v.id}</div>
                  <div>Route: {v.route}</div>
                  <div>Speed: {v.speedKph || '?'} km/h</div>
                </div>
              </Popup>
            </Marker>
          ))}
          {destination && (
            <>
              <Marker position={[destination.lat, destination.lng]} icon={busIcon}>
                <Popup>Destination</Popup>
              </Marker>
              {routeLine && <Polyline positions={routeLine} color="blue"/>}
            </>
          )}
          <ClickToSet onSelect={(latlng) => setDestination({ lat: latlng.lat, lng: latlng.lng })} />
        </MapContainer>
      </div>
      <div style={{ width: 360, padding: 16, borderLeft: '1px solid #ddd', overflow: 'auto' }}>
        <h2>SmartBus Tracker</h2>
        <div>
          <div><strong>From:</strong> {userLoc.lat.toFixed(5)}, {userLoc.lng.toFixed(5)}</div>
          <div><strong>To:</strong> {destination ? `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}` : 'Click on map'}</div>
        </div>
        <section>
          <h3>Nearby Buses</h3>
          {vehicles.length === 0 ? <div>No buses nearby</div> : (
            <ul>
              {vehicles.map(v => (
                <li key={v.id}>#{v.route} at {v.lat.toFixed(4)},{v.lng.toFixed(4)} ({v.speedKph || '?'} km/h)</li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>Traffic</h3>
          {traffic ? (
            <div>
              <div>Congestion: {traffic.congestionLevel}</div>
              <div>Incidents: {traffic.incidentCount}</div>
            </div>
          ) : <div>Select destination</div>}
        </section>
        <section>
          <h3>ETA</h3>
          {eta ? (
            <div>
              <div>Distance: {eta.distanceKm ? `${eta.distanceKm.toFixed(2)} km` : '?'}</div>
              <div>ETA: {eta.etaMinutes ? `${eta.etaMinutes} min` : '?'}</div>
            </div>
          ) : <div>Select destination</div>}
        </section>
        <section>
          <h3>Safety</h3>
          {safety ? (
            <div>
              <div>Score: {safety.score}/100 {safety.isNight ? '(night)' : ''}</div>
            </div>
          ) : <div>Select destination</div>}
        </section>
      </div>
    </div>
  )
}
