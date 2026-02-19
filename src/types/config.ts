export type SchedulerMode = "local" | "api";

/** Configuration for API mode — connects to the Timetablely API */
export interface TimetableApiConfig {
    mode: "api";
    apiKey: string;
    apiSecret: string;
    /** Defaults to https://api.timetablely.com/v1 */
    apiUrl?: string;
}

/** Configuration for local mode — fully self-contained, no network calls */
export interface TimetableLocalConfig {
    mode: "local";
}

export type TimetableConfig = TimetableApiConfig | TimetableLocalConfig;
