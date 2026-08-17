# Timetablely SDK

React SDK for embedding Timetablely scheduling into your own application.

It runs in one of two modes:

- **Local** — self-contained. You supply the data, nothing leaves the page.
- **API** — reads and writes the same records the Timetablely app maintains, on
  the same service. An embedded grid shows what its owner sees in the app,
  because it is the same data rather than a copy of it.

## Installation

```bash
npm install @geo-soft/timetablely-sdk
```

```bash
pnpm add @geo-soft/timetablely-sdk
```

## Importing styles

Import the CSS once, at your entry point, before any SDK component:

```tsx
import "@geo-soft/timetablely-sdk/styles";
```

---

## Local mode

No credentials, no network. You pass the database in and the grid renders it.

```tsx
import "@geo-soft/timetablely-sdk/styles";
import { TimetablelyProvider, TimetableGrid } from "@geo-soft/timetablely-sdk";

function App() {
  return (
    <TimetablelyProvider database={myDatabase}>
      <TimetableGrid />
    </TimetablelyProvider>
  );
}
```

---

## API mode

### 1. Create an API key

Keys are issued per user and act as that user. There is no screen for this
yet, so create one against the service with a signed-in bearer token:

```bash
curl -X POST https://geosoft-service.onrender.com/api/v1/api-keys \
  -H "Authorization: Bearer <your-jwt>" \
  -H "X-App-Source: timetablely" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marketing site", "scopes": ["read"]}'
```

```json
{
  "status": 201,
  "success": true,
  "message": "API key created. Copy the secret now — it is not shown again.",
  "data": {
    "id": "665f...",
    "name": "Marketing site",
    "keyId": "ttly_key_9f2c...",
    "apiSecret": "ttly_sec_4a71...",
    "scopes": ["read"],
    "appSource": "timetablely",
    "createdAt": "2026-08-17T09:12:00.000Z"
  }
}
```

`apiSecret` appears in that one response and is never returned again — only its
hash is stored. Lose it and you create a new key.

**Scopes.** `read` can load data; `write` can also push it back. Embed a
`read` key in a public page: it renders a live timetable and cannot alter it,
whatever the page does with the credentials. Note that a key in client-side
code is readable by anyone who views the page — a `read` key limits what that
costs you, it does not hide the key.

### 2. Point the provider at it

```tsx
import "@geo-soft/timetablely-sdk/styles";
import { TimetablelyProvider, TimetableGrid } from "@geo-soft/timetablely-sdk";

function App() {
  return (
    <TimetablelyProvider
      mode="api"
      apiKey={import.meta.env.VITE_TIMETABLELY_KEY}
      apiSecret={import.meta.env.VITE_TIMETABLELY_SECRET}
      // sessionId="665f..."  — load one class instead of every timetable
      // apiUrl="http://localhost:5000/api/v1"  — self-hosted or local service
    >
      <TimetableGrid />
    </TimetablelyProvider>
  );
}
```

The provider loads on mount and reloads whenever the credentials or
`sessionId` change. Overlapping loads are cancelled, so a slow early response
cannot land after a fast later one.

### 3. Read it

```tsx
import { useTimetable, useTimetableActions } from "@geo-soft/timetablely-sdk";

function TimetableManager() {
  const { database, isLoading, error, refresh } = useTimetable();
  const { save } = useTimetableActions();

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <p>{database?.courses.length} courses</p>
      <button onClick={refresh}>Refresh</button>
      <button onClick={() => database && save(database)}>Save</button>
    </div>
  );
}
```

---

## The service contract

`apiUrl` defaults to `https://geosoft-service.onrender.com/api/v1`. Timetable
records sit under `/timetablely/sync`, and every request carries:

| Header           | Value                                |
| ---------------- | ------------------------------------ |
| `X-API-Key`      | the key's public half                |
| `X-API-Secret`   | the secret half                      |
| `X-App-Source`   | `timetablely`                        |

| Route                                     | Scope   | Purpose                        |
| ----------------------------------------- | ------- | ------------------------------ |
| `GET /timetablely/sync/data`              | `read`  | everything, optionally by session |
| `GET /timetablely/sync/tutors`            | `read`  | tutors                         |
| `GET /timetablely/sync/courses`           | `read`  | courses, tutor populated       |
| `GET /timetablely/sync/sessions`          | `read`  | classes                        |
| `GET /timetablely/sync/templates`         | `read`  | saved layouts                  |
| `GET /timetablely/sync/special-blocks`    | `read`  | breaks, lunch, assemblies      |
| `POST /timetablely/sync/sync`             | `write` | upsert records                 |
| `DELETE /timetablely/sync/<type>/:id`     | `write` | remove one record              |

Every response is wrapped:

```json
{ "status": 200, "success": true, "message": "…", "data": { } }
```

The SDK unwraps `data` for you and raises `TimetablelyApiError` otherwise —
including on a `200` carrying `success: false`, which is the service reporting
a handled failure rather than a result.

```tsx
import { TimetablelyApiError } from "@geo-soft/timetablely-sdk";

try {
  await save(database);
} catch (error) {
  if (error instanceof TimetablelyApiError) {
    // error.status — 401 means the key is wrong; retrying will not help
    // error.code   — "API_KEY_SCOPE_REQUIRED" means the key is read-only
  }
}
```

### Server shapes vs SDK shapes

The service stores Mongo documents: `_id`, lowercase enums, and references
that are populated documents on some routes and bare ids on others. The SDK
translates them so nothing downstream has to care:

| Server                                | SDK                                       |
| ------------------------------------- | ----------------------------------------- |
| `_id`                                 | `id`                                      |
| `tutorId` (document *or* id string)   | `teacherId` (always an id)                |
| `priority: "high"`                    | `priority: PRIORITY.HIGH`                 |
| `availability: [{day, slot, available}]` | `unavailableSlots: ["1-3"]` (the false ones) |
| `specialBlocks[]`                     | `blockedSlots` + `blockedTexts`           |
| template `columns: [{index, duration}]` | `columnDurations: { 0: 30 }`            |

A special block with no `day` repeats across the week, so it expands to one
cell key per weekday. Block names join `blockedTexts`, so a cell someone typed
"Lunch" into is respected the same way a configured block is.

These are exported if you need them directly:

```ts
import { normalizeDatabase, toSyncPayload, createApiClient } from "@geo-soft/timetablely-sdk";
```

---

## API reference

### `<TimetablelyProvider>`

Local mode:

| Prop       | Type                  | Notes                       |
| ---------- | --------------------- | --------------------------- |
| `mode`     | `"local"`             | Optional; the default.      |
| `database` | `ITimetableDatabase`  | The data to render.         |

API mode:

| Prop        | Type            | Notes                                              |
| ----------- | --------------- | -------------------------------------------------- |
| `mode`      | `"api"`         | Required.                                          |
| `apiKey`    | `string`        | Public half of the pair.                           |
| `apiSecret` | `string`        | Secret half.                                       |
| `apiUrl`    | `string`        | Defaults to the hosted service.                    |
| `sessionId` | `string`        | Load one class rather than every timetable.        |
| `fetchImpl` | `typeof fetch`  | For tests, or a host with no global `fetch`.       |

### `useTimetable()`

| Returns     | Type                             |
| ----------- | -------------------------------- |
| `database`  | `ITimetableDatabase \| undefined` |
| `gridState` | grid state and actions           |
| `config`    | the resolved config              |
| `isLoading` | `boolean` — always `false` locally |
| `error`     | `string \| null`                 |
| `refresh`   | `() => Promise<ITimetableDatabase \| null>` |

### `useTimetableActions()`

`resetGrid`, `mergeCells`, `setCellAlignment`, `toggleCellVertical`,
`setCellBackgroundColor`, and `save(database)`. `save` needs API mode and a
`write` key; in local mode it throws.

### `useApiTimetable(config)`

The transport on its own, without the provider. Returns `database`,
`isLoading`, `error`, `lastError`, `refresh`, `save`, and the `fetchTutors` /
`fetchCourses` / `fetchSessions` / `fetchTemplates` convenience readers.

### `<TimetableGrid>`

| Prop            | Type                       |
| --------------- | -------------------------- |
| `className`     | `string`                   |
| `cellClassName` | `string`                   |
| `onCellClick`   | `(cellId: string) => void` |

---

## Theming

The SDK is styled with CSS custom properties. Override them in your own CSS:

```css
:root {
  --ttly-primary: #2563eb;
  --ttly-primary-foreground: #ffffff;

  --ttly-cell-height: 120px;
  --ttly-cell-width: 160px;
  --ttly-header-height: 48px;

  --ttly-cell-bg: #ffffff;
  --ttly-cell-selected-bg: #93c5fd;
  --ttly-cell-editing-bg: #fefce8;
  --ttly-cell-merged-bg: #d1fae5;

  --ttly-background: #ffffff;
  --ttly-foreground: #1f2937;
  --ttly-border: #e5e7eb;
  --ttly-muted: #f3f4f6;
}

.dark {
  --ttly-background: #1f2937;
  --ttly-foreground: #f3f4f6;
  --ttly-cell-bg: #2d3748;
  --ttly-border: #4b5563;
}
```

## Types

```ts
interface TimetableApiConfig {
  mode: "api";
  apiKey: string;
  apiSecret: string;
  apiUrl?: string;
  sessionId?: string;
  fetchImpl?: typeof fetch;
}

interface ITimetableDatabase {
  tutors: ITutor[];
  courses: ICourse[];
  sessions: ISession[];
  /** Cell keys reserved for breaks, lunch, assemblies. */
  blockedSlots: string[];
  /** Text that marks a cell as blocked during generation. */
  blockedTexts: string[];
  templates?: ITimetableTemplate[];
}
```

## License

Apache-2.0
