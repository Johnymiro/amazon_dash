'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '@/utils/api';
import { api } from '@/utils/axios';

interface LogEntry {
  timestamp: string;
  level: string;
  logger_name: string;
  message: string;
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'text-gray-400',
  INFO: 'text-blue-light-400',
  WARNING: 'text-warning-400',
  ERROR: 'text-error-400',
  CRITICAL: 'text-red-600 font-bold',
};

const LEVELS = ['ALL', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [textFilter, setTextFilter] = useState('');
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [authError, setAuthError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const pausedRef = useRef(false);
  const bufferRef = useRef<LogEntry[]>([]);

  // Keep pausedRef in sync
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const connect = useCallback(async () => {
    // Fetch a short-lived WS token before each connection attempt
    let token: string;
    try {
      const res = await api.get('/auth/ws-token');
      token = res.data.token;
      setAuthError(false);
    } catch {
      setAuthError(true);
      setConnected(false);
      return;
    }

    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws/logs?token=' + token;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = (ev) => {
      setConnected(false);
      // 4001 = auth failed on the server side — don't auto-reconnect
      if (ev.code === 4001) {
        setAuthError(true);
        return;
      }
      setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (ev) => {
      let entry: LogEntry;
      try {
        entry = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (pausedRef.current) {
        bufferRef.current.push(entry);
        return;
      }
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > 2000 ? next.slice(-1500) : next;
      });
    };
  }, []);

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);

  // Flush buffer on unpause
  useEffect(() => {
    if (!paused && bufferRef.current.length > 0) {
      const buffered = bufferRef.current;
      bufferRef.current = [];
      setLogs((prev) => {
        const next = [...prev, ...buffered];
        return next.length > 2000 ? next.slice(-1500) : next;
      });
    }
  }, [paused]);

  // Auto-scroll
  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  const filteredLogs = logs.filter((l) => {
    if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
    if (textFilter) {
      const q = textFilter.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.logger_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Logs</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-error-400'}`}>
            {connected ? 'Connected' : authError ? 'Auth required' : 'Reconnecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-gray-50 dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <input
            type="text"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder="Filter..."
            className="bg-gray-50 dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 w-48"
          />
          <button
            onClick={() => setPaused((p) => !p)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${paused ? 'border-yellow-600 text-warning-400' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[600px] overflow-y-auto bg-gray-100 dark:bg-[#0d0d0d] rounded-lg p-3 font-mono text-xs leading-5"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-center pt-8">No log entries{textFilter || levelFilter !== 'ALL' ? ' matching filter' : ''}</div>
        ) : (
          filteredLogs.map((entry, i) => (
            <div key={i} className="hover:bg-gray-200/50 dark:hover:bg-gray-900/50">
              <span className="text-gray-400 dark:text-gray-500">{entry.timestamp.slice(11, 23)}</span>
              {' '}
              <span className={`inline-block w-16 ${LEVEL_COLORS[entry.level] || 'text-gray-400'}`}>
                {entry.level.padEnd(8)}
              </span>
              <span className="text-brand-400">[{entry.logger_name}]</span>
              {' '}
              <span className="text-gray-700 dark:text-gray-300">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
