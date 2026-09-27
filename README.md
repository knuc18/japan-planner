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

## Design & motion

The page is built around two ideas: a railway line diagram (every region has a station code and a line colour, carried through the map, the day-by-day rail and the tables) and hanami, in daylight or at night.

- **Sakura** — [`SakuraField`](src/components/SakuraField.tsx) is one canvas simulation drawn to two layers: most petals behind the text, a few large out-of-focus ones in front while the hero is on screen. Petals tumble (they show their paler underside when they flip), fall slower face-on than edge-on, ride gusts, part around the cursor, and shift with scroll by depth. It also owns the weather: it publishes the current breeze through [`getWind`](src/lib/petals.ts), and anything can throw petals in via `releasePetals`.
- **Branches** — [`planBranch`](src/lib/branch.ts) grows each hero branch from a seed into plain geometry: tapered, zig-zagging limbs with bark lenticels, carrying umbels of flowers on stalks, seen face-on, from the side, from behind, half-open and in bud. [`SakuraBranch`](src/components/SakuraBranch.tsx) paints it on canvas and swings every limb as a damped spring in the shared wind, so gusts bend the twigs and shed petals from the actual flowers. The cursor pushes twigs aside as it brushes through; a click shakes the branch. To try a different branch, change a preset's `seed`.
- **Day / night** — the theme switch reveals the other theme as a circle growing from the toggle (View Transitions, where supported). Underneath, the sun sets behind Fuji and the moon rises; stars, lanterns and a moonlit cloud come in at night.
- **Scroll-linked lines** — the wizard's questions hang on a line that fills as you read, and the itinerary rail fills behind a marker showing the day you're on. These write styles directly each frame ([`useScrollFrame`](src/lib/motion.ts)) rather than re-rendering.
- **Reduced motion** — with `prefers-reduced-motion`, the petals, trains and shooting stars are removed and everything else renders in its settled state. Print also forces every animated element to its final state.
