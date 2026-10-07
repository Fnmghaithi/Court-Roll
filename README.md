# Court Roll

A display board for today's court hearings. It's built for TVs outside or inside the halls, and it also works on laptops and phones. The interface is in Arabic and laid out right to left.

- **Now in session**: the case being heard, shown large with a live indicator.
- **Up next**: the first waiting case after the one in session.
- **Today's cases**: the full list in hearing order. It scrolls on its own in a seamless loop when the list doesn't fit the screen, and it stays still when everything fits or when the viewer prefers reduced motion.

The whole UI scales with the viewport, so it reads well from a 1080p or 4K TV across a hallway.

## Admin mode

To manage the session, hover over the clock and click the settings button that appears beside it, or open the page with `#admin` at the end of the address (for example `http://localhost:5173/#admin`). On phones the button is hidden, so use `#admin` there. The list stops scrolling, and clicking a case opens a menu to set its status:

- تنظر الآن (being heard)
- القضية التالية (up next)
- تمت المناقشة (pleadings finished)
- تم الحكم (judgment given)
- في الانتظار (waiting, to undo a change)

Only one case can be being heard and one up next. Picking a new one moves the previous case back to waiting. Finished cases are dimmed on the board.

`#admin` only switches the interface; it is not a login. Until there is a backend, changes are saved in that browser's local storage (or only in memory where storage is blocked). They survive a reload and update other tabs on the same machine, but TVs on other devices won't see them. Connect `fetchTodaysCases` and `setCaseStatus` in `src/data/cases.ts` to an API (behind real sign-in for admins) to share them.

## Voice announcements

When an admin marks a case as تنظر الآن, the board announces it, for example:

> تُنظر الآن الدعوى رقم مئتين وعشرة لسنة ألفين وأربعة وعشرين. المستأنف: الشركة الوطنية المتحدة للهندسة والمقاولات. المستأنف ضده: شركة سعود بهوان للسيارات.

Case numbers are read as words (number and year), and company-form abbreviations such as ش م م are left out so they aren't spelled letter by letter.

The speech comes from [Supertonic 3](https://github.com/supertone-oss-archive/supertonic), an open text-to-speech model that runs in the browser with ONNX Runtime Web: on the graphics card (WebGPU) when the browser supports it, otherwise on the processor (WebAssembly). Nothing is sent to a speech service. The sound plays on the device where the admin clicks.

In admin mode the banner shows the voice status and has buttons to repeat the last call, open **إعدادات الصوت**, and turn announcements off. The settings, remembered per browser, are:

- **Language**: Arabic, or English (the surrounding words in English, party names still read in Arabic). Supertonic speaks 31 languages; adding another means adding its wording to `buildAnnouncement` in `src/lib/tts/announcement.ts`.
- **Voice**: five male and five female voices.
- **Speed**: 0.8× to 1.5×.
- **Quality**: fast, balanced or highest (4, 8 or 16 denoising steps). Higher is clearer but takes longer before the announcement starts.
- **تجربة الصوت** plays a test sentence with the current settings.

### Where the model comes from

The model files are large (several hundred MB). The engine and model load only in admin mode, and each browser keeps them in its storage after the first download.

- **On this machine (recommended for the court):** run `npm run download-voice` once. It saves the files in `public/supertonic`, and the board then serves them itself and uses them automatically, with no internet needed after that. The folder is ignored by git.
- **Otherwise** they are downloaded in the browser from the archived Supertonic 3 snapshot on Hugging Face (pinned to a revision), or from `VITE_SUPERTONIC_URL` if set at build time.

Supertone has archived the project, so keeping a local copy also protects the board if the archive moves. The model is licensed under OpenRAIL-M; the inference code ported in `src/lib/tts/supertonic.ts` is MIT.

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
- `status`: `"waiting"`, `"next"`, `"in_review"`, `"discussed"` or `"judged"`

The roll itself has no statuses, so the first case is marked as being heard for the demo. `SESSION_INFO` in the same file holds the court name and hall shown in the header.

To connect a real backend, change `fetchTodaysCases()` to call your API. `useCourtCases` already reloads the data every 30 seconds.
