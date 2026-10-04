# Court Roll

A display board for today's court hearings. It's built for TVs outside or inside the halls, and it also works on laptops and phones.

- **Now in session**: the case being heard, shown large with a live indicator.
- **Up next**: the first waiting case after the one in session.
- **Today's cases**: the full list in hearing order. It scrolls on its own in a seamless loop when the list doesn't fit the screen, and it stays still when everything fits or when the viewer prefers reduced motion.

The whole UI scales with the viewport, so it reads well from a 1080p or 4K TV across a hallway.

## Stack

React, TypeScript, Vite, Tailwind CSS v4 and shadcn/ui (Card, Badge, Separator), with lucide icons and the Geist fonts.

## Running

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
npm run preview  # serve the build
```

For a TV, open the page in the screen's browser (or a kiosk-mode browser) and go fullscreen.

## Data

The cases are dummy data in `src/data/cases.ts`. Each case has a `caseNumber`, `plaintiff`, `defendant` and a `status` of `"in_review"` or `"waiting"`, and the array order is the hearing order. To connect a real backend, change `fetchTodaysCases()` to call your API. `useCourtCases` already reloads the data every 30 seconds.
