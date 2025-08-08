# SmartBus Tracker (Server)

- Copy `.env.example` to `.env` and set values
- Install deps: `npm i`
- Run dev: `npm run dev`

API endpoints:
- GET `/api/health`
- GET `/api/bus/nearest?lat=..&lng=..`
- GET `/api/bus/traffic?fromLat=..&fromLng=..&toLat=..&toLng=..`
- GET `/api/bus/eta?fromLat=..&fromLng=..&toLat=..&toLng=..`
- GET `/api/safety/route-score?fromLat=..&fromLng=..&toLat=..&toLng=..`