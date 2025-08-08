# SmartBus Tracker (MERN)

A real-time public transport assistant: nearest buses, traffic, ETA, and safety.

## Quickstart

- Server
  - `cd server && cp .env.example .env && npm i && npm run dev`
- Client
  - `cd client && npm i && npm run dev`

Open `http://localhost:5173`. The map centers on your location (if permitted). Click on the map to set a destination.

Environment variables in `server/.env.example` can be set to real API endpoints for GTFS-RT, traffic, and routing.