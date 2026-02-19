import React, { createContext, useContext } from "react";
import type { IGridState, IGridActions } from "../types/grid";
import type { ITimetableDatabase } from "../types/database";
import type { TimetableConfig } from "../types/config";
import { useGridState } from "../hooks/useGridState";

export interface TimetablelyContextValue {
  gridState: IGridState & IGridActions;
  database?: ITimetableDatabase;
  config?: TimetableConfig;
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
  apiKey: string;
  apiSecret: string;
  apiUrl?: string;
  children: React.ReactNode;
}

export type TimetablelyProviderProps =
  | TimetablelyProviderLocalProps
  | TimetablelyProviderApiProps;

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
 * @example API mode
 * ```tsx
 * <TimetablelyProvider mode="api" apiKey="..." apiSecret="...">
 *   <TimetableGrid gridState={...} />
 * </TimetablelyProvider>
 * ```
 */
export const TimetablelyProvider: React.FC<TimetablelyProviderProps> = (props) => {
  const gridState = useGridState();

  let database: ITimetableDatabase | undefined;
  let config: TimetableConfig | undefined;

  if (!props.mode || props.mode === "local") {
    database = (props as TimetablelyProviderLocalProps).database;
    config = { mode: "local" };
  } else {
    const apiProps = props as TimetablelyProviderApiProps;
    config = {
      mode: "api",
      apiKey: apiProps.apiKey,
      apiSecret: apiProps.apiSecret,
      apiUrl: apiProps.apiUrl,
    };
  }

  return (
    <TimetablelyContext.Provider value={{ gridState, database, config }}>
      {props.children}
    </TimetablelyContext.Provider>
  );
};

export const useTimetablelyContext = (): TimetablelyContextValue => {
  const ctx = useContext(TimetablelyContext);
  if (!ctx) {
    throw new Error("useTimetablelyContext must be used within <TimetablelyProvider>");
  }
  return ctx;
};
