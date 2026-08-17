export type SchedulerMode = "local" | "api";

/**
 * Configuration for API mode — reads and writes the real Timetablely service.
 *
 * The key pair is issued per user from the app (Settings → API keys, or
 * `POST /api-keys`). It authenticates as that user, so an embedded grid shows
 * the data its owner maintains in the app.
 *
 * A read-only key cannot write. That is the pair to embed in a public site:
 * the page renders a live timetable and cannot alter it, whatever the page
 * does with the credentials.
 */
export interface TimetableApiConfig {
    mode: "api";
    /** Public half of the pair, sent as `X-API-Key`. */
    apiKey: string;
    /** Secret half, sent as `X-API-Secret`. Shown once, at creation. */
    apiSecret: string;
    /** Defaults to the hosted service; override to point at your own. */
    apiUrl?: string;
    /** Limits the load to one class's timetable rather than every one. */
    sessionId?: string;
    /** Supply your own fetch — for tests, or a host without a global one. */
    fetchImpl?: typeof fetch;
}

/** Configuration for local mode — fully self-contained, no network calls */
export interface TimetableLocalConfig {
    mode: "local";
}

export type TimetableConfig = TimetableApiConfig | TimetableLocalConfig;
