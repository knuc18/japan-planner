# Japan Trip Planner

Tell it how many days you have and what you're into, and it routes a realistic Japan itinerary — real train/flight legs, day-by-day activities, and an honest cost breakdown, including a JR Pass break-even check.

Static Vite + React + TypeScript site, no backend. Deployed to GitHub Pages via GitHub Actions on every push to `main`.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

Trip planning logic lives in [`src/lib/itinerary.ts`](src/lib/itinerary.ts); region/activity/transport data is in [`src/data/`](src/data/). All fares and prices are hand-curated 2026 estimates, not live pricing.
