# Court Roll

The court-session pages for the ASP.NET backend, rebuilt with React, TypeScript, Vite, Tailwind CSS v4 and shadcn/ui. They are in Arabic, laid out right to left, and use the navy and gold theme. They talk to the same backend endpoints and SignalR hub as the original HTML pages, and they keep the same file names and URLs.

| Page | For | Opened with |
|---|---|---|
| `admin-dashboard.html` | Managing sessions: month calendar, create, view, delete | no parameters |
| `clerk-panel.html` | The clerk (أمين السر): changes case statuses | `?session=<id>` or `?court=&hall=&date=` |
| `hearing-schedule.html` | The audience and hall TVs: live board with announcements | `?session=<id>` or `?court=&hall=&date=` |

## Running in development

Needs Node.js 20.19+ or 22.12+ (`.nvmrc` pins 22). On older Node, npm skips the build tool's native package and `npm run dev` fails with "Cannot find native binding".

```bash
npm install
npm run mock     # terminal 1: stand-in backend on http://localhost:5080
npm run dev      # terminal 2: http://localhost:5173/admin-dashboard.html
```

The dev server forwards `/api`, `/sessionHub` and `/js` to the backend. It uses the mock by default; to use the real ASP.NET backend instead, start it and run:

```bash
BACKEND_URL=https://localhost:7001 npm run dev
```

### The mock backend

`scripts/mock/server.mjs` implements every endpoint the pages use, a SignalR hub at `/sessionHub` (the JSON protocol, so the official client connects to it), and a stand-in `/js/tafqit.min.js`. It starts with today's two sessions in hall 6 of the investment court, built from the real 27/01/2026 roll (35 cases reserved for judgment and 94 for pleading), and a few sessions on other days. Its investment-court panel 2 returns 404, to show the "no cases" path. Data is kept in memory and resets on restart.

## Building into the ASP.NET project

```bash
WWWROOT=../YourBackend/wwwroot npm run build
```

This writes `admin-dashboard.html`, `clerk-panel.html` and `hearing-schedule.html` over the old pages, puts the scripts and styles in `wwwroot/court-roll-assets/`, and adds `court-roll-icon.svg`. Nothing else in `wwwroot` is deleted or replaced: the backend's `/js/tafqit.min.js` and `/js/signalr.min.js` stay where they are. Without `WWWROOT` the build goes to `dist/`.

## Backend contract

The endpoints, payloads and field names are unchanged from the original pages (see `src/lib/api.ts`):

- `GET /api/session/courts`, `/courts/{id}/halls`, `/courts/{id}/panels`
- `GET /api/session/calendar?month=YYYY-MM&courtId=&hallId=`
- `GET /api/session/sessions?courtId=&hallId=&date=` and `GET /api/session/sessions/{id}`
- `POST /api/session/sessions` (empty session), `POST /api/session/investment/sessions` (404 means no cases), `POST /api/document/upload-and-create-session` (Word file, multipart)
- `DELETE /api/session/sessions/{id}`
- `PUT /api/session/sessions/{sessionId}/cases/{caseId}/status` with `{ status, modifiedBy: "أمين السر" }`
- SignalR `/sessionHub`: `JoinSession(sessionId)` and the `CaseStatusChanged(caseId, newStatus, modifiedBy)` event

Statuses are the backend's values: `in-review` (في الإنتظار), `upcoming-next` (الجلسة القادمة), `in-progress` (تنظر الآن), `discussed` (تمت المناقشة), `ruling-issued` (تم الحكم). Case numbers are shown reversed, as before (`210/7103/2024` → `2024/7103/210`). The public prosecution number (رقم الإدعاء العام) is not shown; the case number identifies every case.

## What each page does

**Admin dashboard.** Court and hall filters and a Sunday-first month calendar showing how many sessions each day has. Clicking a day lists its sessions, with buttons to open the audience view, open the clerk panel, or delete (after a confirmation dialog). **إنشاء جلسة جديدة** creates a session in one of three ways:
- **Investment court** (its name contains "الاستثمار"): pick the panel (الدائرة); the cases come from the backend. The Word upload, order and title fields are hidden, since that path doesn't use them.
- **With a Word file:** uploaded with the session details.
- **Empty session:** sent as JSON with `hearingInfo`.

Messages appear as toasts instead of browser alerts.

**Clerk panel.** With several sessions on a date it first shows them with counts per status. Clicking a case opens a menu of the five statuses; the change is saved with the PUT request and confirmed with a toast. Choosing تنظر الآن again on the case being heard sends it again, so the hall hears the case called again. Changes from other clerk panels arrive live. Buttons: back to the dashboard, the session list, and copy the audience link.

**Hearing schedule.** The case being heard and the next case in large cards, the panel members (أعضاء الهيئة), and the full list scrolling continuously. Without parameters it goes to the dashboard; with several sessions on a date it shows the session list first. It joins all of the day's sessions, so when a case in another session becomes تنظر الآن it switches to that session and announces the case. After each full pass of the list it moves to the next session, but it stays on (or moves to) a session whose case is being heard. A tools menu (أدوات) slides down when the mouse reaches the top-right corner: dashboard, session list and voice settings.

## Voice announcements

When a case becomes تنظر الآن, the hearing schedule announces it.

**Engine.** Set in one line in `src/lib/tts/config.ts`:

```ts
export const TTS_ENGINE: TtsEngine = ... ?? "webspeech"   // or "supertonic"
```

A build can also set `VITE_TTS_ENGINE=supertonic`.

- `"webspeech"` (default): the browser's built-in voices, as in the original page: Microsoft Naayf when available (otherwise the first Arabic voice), rate 2.2, pitch 0.5.
- `"supertonic"`: [Supertonic 3](https://github.com/supertone-oss-archive/supertonic), an open text-to-speech model that runs on the device with ONNX Runtime Web (graphics card via WebGPU when available, otherwise the processor).

**Wording.** Chosen in the voice settings and remembered per browser:

- **الصيغة الحالية** (default): the original sentence, «القضية رقم …، على …، على …، تُنْظَرُ الْآنَ», with each part of the case number spelled out by the backend's `/js/tafqit.min.js`.
- **الصيغة المشكولة**: «تُنْظَرُ الآنَ الدَّعْوَى رَقْم مِئَتَيْن وَعَشَرَة لِسَنَة أَلْفَيْن وَأَرْبَعَة وَعِشْرِين», spelled with full tashkeel in the pausal form announcers use, reading the case number, the parties' names, or both. Company-form abbreviations such as ش م م are left out of names so they aren't spelled letter by letter.

With Supertonic the settings also offer the language (Arabic, or English around the Arabic names), five male and five female voices, speed and quality. **تجربة الصوت** plays a test sentence.

**Blocked sound.** Browsers may refuse to play sound on a page nobody has clicked. If an announcement is blocked, a button appears in the corner; one click enables sound and replays it. Running the TV browser in kiosk mode with autoplay allowed avoids this.

### Supertonic model files

The model is large (about 380 MB) and loads only when Supertonic is the engine. Run `npm run download-voice` once to save it in `public/supertonic`; it is then built into `wwwroot/supertonic` and served by the backend, so no internet is needed. Without it, each browser downloads the model from the archived Supertonic 3 snapshot on Hugging Face (pinned to a revision), or from `VITE_SUPERTONIC_URL`, and keeps it after the first download. Supertone has archived the project, so keeping your own copy is safer. The model is licensed under OpenRAIL-M; the inference code ported in `src/lib/tts/supertonic.ts` is MIT.

## Project layout

- `admin-dashboard.html`, `clerk-panel.html`, `hearing-schedule.html`: page entry points
- `src/pages/*`: one folder per page
- `src/components/court/*`: the board pieces shared by the pages; `src/components/ui/*`: shadcn components
- `src/lib/api.ts`: backend client and types; `src/hooks/use-session-hub.ts`: SignalR
- `src/lib/tts/*`: announcements (`config.ts` picks the engine)
- `scripts/mock/`: the mock backend; `scripts/download-voice.mjs`: Supertonic model download
