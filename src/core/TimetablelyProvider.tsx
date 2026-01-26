import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  TimetableConfig,
  TimetableContextValue,
  TimetableData,
  ICourse,
  ITutor,
  ISession,
  ITimetableCell,
} from "./types";

const TimetableContext = createContext<TimetableContextValue | undefined>(
  undefined
);

export interface TimetablelyProviderProps {
  config: TimetableConfig;
  children: React.ReactNode;
}

export const TimetablelyProvider: React.FC<TimetablelyProviderProps> = ({
  config,
  children,
}) => {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [tutors, setTutors] = useState<ITutor[]>([]);
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(
        `${config.apiUrl}/timetables/${config.sessionId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch timetable");
      }

      const data = await response.json();
      setTimetable(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${config.apiUrl}/courses`, { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setCourses(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${config.apiUrl}/tutors`, { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch tutors");
      }

      const data = await response.json();
      setTutors(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${config.apiUrl}/sessions`, { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const updateCell = useCallback(
    async (cellId: string, updates: Partial<ITimetableCell>) => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (config.apiKey) {
          headers["Authorization"] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(
          `${config.apiUrl}/timetables/${config.sessionId}/cells/${cellId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update cell");
        }

        const data = await response.json();
        setTimetable(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [config]
  );

  const generateTimetable = useCallback(
    async (type: "standard" | "ai") => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (config.apiKey) {
          headers["Authorization"] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(
          `${config.apiUrl}/timetables/${config.sessionId}/generate`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ type }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate timetable");
        }

        const data = await response.json();
        setTimetable(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [config]
  );

  const value: TimetableContextValue = {
    config,
    timetable,
    courses,
    tutors,
    sessions,
    isLoading,
    error,
    fetchTimetable,
    updateCell,
    generateTimetable,
    fetchCourses,
    fetchTutors,
    fetchSessions,
  };

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetableContext = () => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error(
      "useTimetableContext must be used within TimetablelyProvider"
    );
  }
  return context;
};
