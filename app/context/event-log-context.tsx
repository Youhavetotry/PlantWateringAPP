import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EventSource = 'user' | 'system';
export type EventCategory = 'pump' | 'smart_watering' | 'camera' | 'settings' | 'notification' | 'sensor' | 'app' | 'error' | 'navigation' | 'device' | 'plant' | 'auth';

export type EventLogItem = {
  id: string;
  timestamp: number; // ms
  source: EventSource;
  category: EventCategory;
  action: string;
  message: string;
  meta?: Record<string, any>;
};

export type EventLogContextValue = {
  logs: EventLogItem[];
  logEvent: (item: Omit<EventLogItem, 'id' | 'timestamp'> & Partial<Pick<EventLogItem, 'timestamp'>>) => void;
  clearLogs: () => Promise<void>;
  setMaxLogs: (n: number) => void;
};

const EventLogContext = createContext<EventLogContextValue | undefined>(undefined);

const STORAGE_KEY = 'eventLogs';
const DEFAULT_MAX_LOGS = 200;
const DEFAULT_DEDUPE_WINDOW_MS = 1000; // 1s per user request

export const EventLogProvider: React.FC<{ children: React.ReactNode; maxLogs?: number; dedupeWindowMs?: number; }> = ({ children, maxLogs = DEFAULT_MAX_LOGS, dedupeWindowMs = DEFAULT_DEDUPE_WINDOW_MS }) => {
  const [logs, setLogs] = useState<EventLogItem[]>([]);
  const maxLogsRef = useRef<number>(maxLogs);
  const dedupeWindowRef = useRef<number>(dedupeWindowMs);

  useEffect(() => { maxLogsRef.current = maxLogs; }, [maxLogs]);
  useEffect(() => { dedupeWindowRef.current = dedupeWindowMs; }, [dedupeWindowMs]);

  // load persisted
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: EventLogItem[] = JSON.parse(raw);
          if (Array.isArray(parsed)) setLogs(parsed);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const persist = useCallback(async (items: EventLogItem[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, []);

  const setMaxLogs = useCallback((n: number) => { maxLogsRef.current = n; }, []);

  const clearLogs = useCallback(async () => {
    setLogs([]);
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const logEvent = useCallback((item: Omit<EventLogItem, 'id' | 'timestamp'> & Partial<Pick<EventLogItem, 'timestamp'>>) => {
    const now = Date.now();
    const newItem: EventLogItem = {
      id: `${item.action}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: item.timestamp ?? now,
      source: item.source,
      category: item.category,
      action: item.action,
      message: item.message,
      meta: item.meta,
    };

    setLogs(prev => {
      // dedupe: if same action+message within window, skip
      const windowMs = dedupeWindowRef.current;
      const found = prev.find(it => it.action === newItem.action && it.message === newItem.message && (now - it.timestamp) <= windowMs);
      if (found) return prev; // skip

      const next = [newItem, ...prev];
      if (next.length > maxLogsRef.current) next.length = maxLogsRef.current;
      // persist async
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo<EventLogContextValue>(() => ({ logs, logEvent, clearLogs, setMaxLogs }), [logs, logEvent, clearLogs]);

  return (
    <EventLogContext.Provider value={value}>{children}</EventLogContext.Provider>
  );
};

export const useEventLog = () => {
  const ctx = useContext(EventLogContext);
  if (!ctx) throw new Error('useEventLog must be used within EventLogProvider');
  return ctx;
};

export default { useEventLog };