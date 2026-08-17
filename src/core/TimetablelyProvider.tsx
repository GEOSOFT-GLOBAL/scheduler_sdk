import React, { createContext, useContext, useMemo } from "react";
import type { IGridState, IGridActions } from "../types/grid";
import type { ITimetableDatabase } from "../types/database";
import type { TimetableApiConfig, TimetableConfig } from "../types/config";
import { useGridState } from "../hooks/useGridState";
import { useApiTimetable } from "../hooks/useApiTimetable";

export interface TimetablelyContextValue {
  gridState: IGridState & IGridActions;
  /** In API mode this is the server's data, and null until the first load. */
  database?: ITimetableDatabase;
  config?: TimetableConfig;
  /** True while API mode is loading. Always false in local mode. */
  isLoading: boolean;
  /** The last API failure, or null. Always null in local mode. */
  error: string | null;
  /** Re-reads the server. A no-op in local mode. */
  refresh: () => Promise<ITimetableDatabase | null>;
  /** Pushes the database to the server. Rejects in local mode. */
  save: (database: ITimetableDatabase) => Promise<boolean>;
}

const TimetablelyContext = createContext<TimetablelyContextValue | undefined>(undefined);

// ─── Local Mode Props ───────────────────────────────────────────────────────
export interface TimetablelyProviderLocalProps {
  mode?: "local";
  database?: ITimetableDatabase;
  children: React.ReactNode;
}

// ─── API Mode Props ─────────────────────────────────────────────────────────
export interface TimetablelyProviderApiProps {
  mode: "api";
  /** Public half of the key pair, from Settings → API keys in the app. */
  apiKey: string;
  /** Secret half. Shown once, when the key is created. */
  apiSecret: string;
  /** Defaults to the hosted service; override to point at your own. */
  apiUrl?: string;
  /** Load one class's timetable rather than every one. */
  sessionId?: string;
  /** Supply your own fetch — for tests, or a host without a global one. */
  fetchImpl?: typeof fetch;
  children: React.ReactNode;
}

export type TimetablelyProviderProps =
  | TimetablelyProviderLocalProps
  | TimetablelyProviderApiProps;

const isApiProps = (
  props: TimetablelyProviderProps,
): props is TimetablelyProviderApiProps => props.mode === "api";

/**
 * API mode. Split into its own component because hooks cannot be called
 * conditionally, and local mode must not open a connection it has no
 * credentials for.
 */
const ApiProvider: React.FC<TimetablelyProviderApiProps> = ({
  children,
  ...credentials
}) => {
  const gridState = useGridState();

  const config = useMemo<TimetableApiConfig>(
    () => ({ ...credentials, mode: "api" }),
    // Spread into a stable object so a caller passing an inline config object
    // does not re-open the connection on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      credentials.apiKey,
      credentials.apiSecret,
      credentials.apiUrl,
      credentials.sessionId,
      credentials.fetchImpl,
    ],
  );

  const { database, isLoading, error, refresh, save } = useApiTimetable(config);

  const value = useMemo<TimetablelyContextValue>(
    () => ({
      gridState,
      database: database ?? undefined,
      config,
      isLoading,
      error,
      refresh,
      save,
    }),
    [gridState, database, config, isLoading, error, refresh, save],
  );

  return (
    <TimetablelyContext.Provider value={value}>
      {children}
    </TimetablelyContext.Provider>
  );
};

/** Local mode. No network, no credentials — the database is whatever you pass. */
const LocalProvider: React.FC<TimetablelyProviderLocalProps> = ({
  children,
  database,
}) => {
  const gridState = useGridState();

  const value = useMemo<TimetablelyContextValue>(
    () => ({
      gridState,
      database,
      config: { mode: "local" },
      isLoading: false,
      error: null,
      refresh: async () => database ?? null,
      save: async () => {
        throw new Error(
          "save() needs API mode — local mode has no server to save to.",
        );
      },
    }),
    [gridState, database],
  );

  return (
    <TimetablelyContext.Provider value={value}>
      {children}
    </TimetablelyContext.Provider>
  );
};

/**
 * TimetablelyProvider — wraps your application to provide timetable state.
 *
 * @example Local mode (no API)
 * ```tsx
 * <TimetablelyProvider database={myDatabase}>
 *   <TimetableGrid gridState={...} />
 * </TimetablelyProvider>
 * ```
 *
 * @example API mode — reads the same records the app maintains
 * ```tsx
 * <TimetablelyProvider mode="api" apiKey="ttly_key_..." apiSecret="ttly_sec_...">
 *   <TimetableGrid gridState={...} />
 * </TimetablelyProvider>
 * ```
 */
export const TimetablelyProvider: React.FC<TimetablelyProviderProps> = (props) =>
  isApiProps(props) ? <ApiProvider {...props} /> : <LocalProvider {...props} />;

export const useTimetablelyContext = (): TimetablelyContextValue => {
  const ctx = useContext(TimetablelyContext);
  if (!ctx) {
    throw new Error("useTimetablelyContext must be used within <TimetablelyProvider>");
  }
  return ctx;
};
