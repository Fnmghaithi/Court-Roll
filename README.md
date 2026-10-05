# Court Roll

A display board for today's court hearings. It's built for TVs outside or inside the halls, and it also works on laptops and phones. The interface is in Arabic and laid out right to left.

- **Now in session**: the case being heard, shown large with a live indicator.
- **Up next**: the first waiting case after the one in session.
- **Today's cases**: the full list in hearing order. It scrolls on its own in a seamless loop when the list doesn't fit the screen, and it stays still when everything fits or when the viewer prefers reduced motion.

The whole UI scales with the viewport, so it reads well from a 1080p or 4K TV across a hallway.

## Stack

React, TypeScript, Vite, Tailwind CSS v4 and shadcn/ui (Card, Badge, Separator), with lucide icons, IBM Plex Sans Arabic for text and Geist Mono for case numbers and the clock.

## Running

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
npm run preview  # serve the build
```

For a TV, open the page in the screen's browser (or a kiosk-mode browser) and go fullscreen.

## Data

The cases live in `src/data/cases.ts`. They are a real sample taken from the hearing roll of 27/01/2026 for the Appellate Circuit of the Investment and Commercial Court in Muscat, hall 6: 129 cases, 35 reserved for judgment and 94 for pleading, in hearing order.

Each case has:

- `caseNumber`, for example `210/7103/2024`
- `plaintiff`, the appellant (المستأنف)
- `defendant`, the appellee (المستأنف ضده)
- `listing`: `"judgment"` (محجوزة للحكم) or `"pleading"` (مرافعة)
- `status`: `"in_review"` or `"waiting"`

The roll itself has no statuses, so the first case is marked as being heard for the demo. `SESSION_INFO` in the same file holds the court name and hall shown in the header.

To connect a real backend, change `fetchTodaysCases()` to call your API. `useCourtCases` already reloads the data every 30 seconds.
