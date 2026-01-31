'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/utils/api';

/**
 * UCCL Panel (Unified Command & Communication Log)
 * ================================================
 * A 3-Column View visualizing the "Life Cycle of an AI Decision":
 * 
 * Column 1: THOUGHT (The Why)  - LLM Telemetry (Prompts/Responses)
 * Column 2: HANDSHAKE (The How) - Inter-Agent Protocols (Mission/State)
 * Column 3: ACTION (The What)   - Final Execution (Bids)
 */

interface LogData {
    // Shared
    id: string;
    timestamp: string;
    type: 'BID' | 'HANDSHAKE' | 'THOUGHT';

    // Dynamic data bag
    data: any;
}

interface UnifiedLogResponse {
    count: number;
    logs: LogData[];
}

const fetchUnifiedLogs = async (): Promise<LogData[]> => {
    const res = await fetch(`${API_BASE}/shadow/logs/unified?limit=100`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch unified logs');
    const data: UnifiedLogResponse = await res.json();
    return data.logs;
};

// Format timestamp to HH:MM:SS.ms
const formatTime = (isoString: string): string => {
    try {
        const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
        return date.toLocaleTimeString('de-DE', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3 // Show milliseconds for tight syncing
        });
    } catch {
        return '--:--:--';
    }
};

export default function UCCLPanel() {
    const [isLive, setIsLive] = useState(true);

    const { data: logs, isLoading, error } = useQuery({
        queryKey: ['unified-logs'],
        queryFn: fetchUnifiedLogs,
        refetchInterval: isLive ? 2000 : false, // Fast poll for realtime feel
    });

    if (isLoading) return <div className="p-4 text-slate-500 font-mono text-xs animate-pulse">Initializing Neural Link...</div>;
    if (error) return <div className="p-4 text-red-500 font-mono text-xs">⚠️ Connection Lost: Neural Link Failure</div>;

    // Filter streams
    const thoughts = logs?.filter(l => l.type === 'THOUGHT') || [];
    const handshakes = logs?.filter(l => l.type === 'HANDSHAKE') || [];
    const bids = logs?.filter(l => l.type === 'BID') || [];

    return (
        <section className="bg-[#050505] border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50 mt-6">
            {/* Header */}
            <div className="bg-[#0a0a0a] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🧬</span>
                    <div>
                        <div className="text-sm font-bold text-slate-200 tracking-wider">UNIFIED COMMAND LOG</div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Causality Trace: Thought → Handshake → Action</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">
                        {logs?.length || 0} Events Cached
                    </span>
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${isLive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                    >
                        {isLive ? '● LIVE SYNC' : '○ PAUSED'}
                    </button>
                </div>
            </div>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[400px] max-h-[600px]">

                {/* COLUMN 1: THOUGHT STREAM (Blue/Purple) */}
                <div className="flex flex-col bg-[#080808]">
                    <div className="px-3 py-2 bg-[#0d0d0d] border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                        <span className="text-xs font-bold text-blue-400 font-mono">1. THOUGHT STREAM</span>
                        <span className="text-[10px] text-slate-600">LLM Telemetry</span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-2 space-y-2">
                        {thoughts.map((log) => (
                            <div key={log.id} className="bg-blue-900/5 border border-blue-900/20 rounded p-2 text-xs hover:bg-blue-900/10 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-slate-500 font-mono text-[10px]">{formatTime(log.timestamp)}</span>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded">
                                        {log.data.latency?.toFixed(0)}ms
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🧠</span>
                                    <span className="font-bold text-slate-300 uppercase">{log.data.agent}</span>
                                    <span className="text-[10px] text-slate-500">{log.data.model}</span>
                                </div>
                                <div className="space-y-1 font-mono text-[10px]">
                                    <div className="text-slate-400 truncate border-l-2 border-slate-700 pl-1" title={log.data.prompt}>
                                        <span className="text-blue-500">In:</span> {log.data.prompt}
                                    </div>
                                    <div className="text-slate-300 truncate border-l-2 border-blue-500/50 pl-1" title={log.data.response}>
                                        <span className="text-emerald-500">Out:</span> {log.data.response}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: HANDSHAKE LOG (Amber/Orange) */}
                <div className="flex flex-col bg-[#050505]">
                    <div className="px-3 py-2 bg-[#0d0d0d] border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                        <span className="text-xs font-bold text-amber-400 font-mono">2. HANDSHAKE PROTOCOL</span>
                        <span className="text-[10px] text-slate-600">Inter-Agent</span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-2 space-y-2">
                        {handshakes.map((log) => (
                            <div key={log.id} className="bg-amber-900/5 border border-amber-900/20 rounded p-2 text-xs hover:bg-amber-900/10 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-slate-500 font-mono text-[10px]">{formatTime(log.timestamp)}</span>
                                    <span className="text-[10px] text-amber-500/50">PROTOCOL</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1 justify-center py-1">
                                    <span className="font-bold text-slate-300">{log.data.sender}</span>
                                    <span className="text-slate-500 text-[10px]">→</span>
                                    <span className="font-bold text-slate-300">{log.data.receiver}</span>
                                </div>
                                <div className="bg-[#0a0a0a] p-1.5 rounded border border-slate-800 text-center">
                                    <div className="text-amber-400 font-medium truncate" title={log.data.message}>
                                        {log.data.message}
                                    </div>
                                    {log.data.payload && (
                                        <div className="text-[9px] text-slate-500 mt-1 truncate font-mono">
                                            {log.data.payload}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 3: ACTION TRACE (Green/Red) */}
                <div className="flex flex-col bg-[#080808]">
                    <div className="px-3 py-2 bg-[#0d0d0d] border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                        <span className="text-xs font-bold text-emerald-400 font-mono">3. ACTION TRACE</span>
                        <span className="text-[10px] text-slate-600">Final Execution</span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-2 space-y-2">
                        {bids.map((log) => {
                            const isIncrease = log.data.reasoning?.includes('Increasing');
                            return (
                                <div key={log.id} className={`bg-emerald-900/5 border ${isIncrease ? 'border-emerald-500/30' : 'border-slate-800'} rounded p-2 text-xs hover:bg-emerald-900/10 transition-colors`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-slate-500 font-mono text-[10px]">{formatTime(log.timestamp)}</span>
                                        <span className={`text-[10px] px-1 rounded ${log.data.state === 'profit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {log.data.state}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-lg">{log.data.keyword ? '🔑' : '📦'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-slate-300 font-medium truncate" title={log.data.keyword}>
                                                {log.data.keyword}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-[#0a0a0a] p-1.5 rounded border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 text-[10px]">BID</span>
                                            <span className="text-emerald-400 font-bold font-mono">${log.data.optimal_bid?.toFixed(2)}</span>
                                        </div>
                                        {log.data.current_bid > 0 && (
                                            <div className="text-[9px] text-slate-500">
                                                was ${log.data.current_bid?.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
