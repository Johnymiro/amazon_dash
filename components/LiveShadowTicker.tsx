'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/utils/api';
import DecisionContextModal, { type DecisionContext } from './DecisionContextModal';

/**
 * Live Shadow Ticker
 * ==================
 * Real-time stream of autonomous AI bid decisions.
 * 
 * Features:
 * - Auto-refreshes every 5 seconds
 * - Terminal-style dense layout
 * - Read-only (NO buttons)
 * - Shows agent, target, trade comparison, and logic trace
 */

interface ShadowLogEntry {
    timestamp: string;
    keyword_id: string;
    keyword_text: string | null;
    optimal_bid: number;
    current_bid: number | null;
    alpha_delta_pct: number | null;
    fsm_state: string;
    m_supply: number | null;
    delta_p: number | null;
    trigger: string | null;
}

// Fetch shadow logs from API
const fetchShadowLogs = async (): Promise<ShadowLogEntry[]> => {
    const res = await fetch(`${API_BASE}/shadow/recent-bids?limit=50`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch shadow logs');
    const data = await res.json();
    return data.bids || [];
};

// Agent icon mapping based on trigger/state
const getAgentInfo = (trigger: string | null, fsmState: string): { icon: string; name: string; color: string } => {
    if (trigger?.includes('PULSE') || trigger?.includes('AUTO')) {
        return { icon: '⚡', name: 'Pulse', color: 'text-brand-400' };
    }
    if (trigger?.includes('SENTINEL') || fsmState === 'rationing' || fsmState === 'defense') {
        return { icon: '🛡️', name: 'Sentinel', color: 'text-warning-400' };
    }
    if (trigger?.includes('STRATEGIST') || fsmState === 'launch') {
        return { icon: '🎯', name: 'Strategist', color: 'text-blue-light-400' };
    }
    // Default to Tactician
    return { icon: '🤖', name: 'Tactician', color: 'text-success-400' };
};

// Format timestamp to HH:MM:SS (convert UTC to local timezone)
const formatTime = (isoString: string): string => {
    try {
        // Database stores times in UTC without timezone suffix
        // We need to append 'Z' to tell JavaScript "this is UTC"
        // Then toLocaleTimeString will automatically convert to browser's local time

        // Check if timestamp already has timezone info
        const hasTimezone = isoString.endsWith('Z') ||
            /[+-]\d{2}:\d{2}$/.test(isoString) ||
            /[+-]\d{4}$/.test(isoString);

        // If no timezone, assume UTC and append 'Z'
        const utcString = hasTimezone ? isoString : isoString + 'Z';

        const date = new Date(utcString);

        // Validate the date is valid
        if (isNaN(date.getTime())) {
            return '--:--:--';
        }

        // toLocaleTimeString will convert to the browser's local timezone
        return date.toLocaleTimeString('de-DE', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return '--:--:--';
    }
};

// Generate multi-line Chain of Thought from entry data
interface ChainOfThought {
    lines: { agent: string; icon: string; text: string }[];
}

const generateChainOfThought = (entry: ShadowLogEntry): ChainOfThought => {
    const lines: ChainOfThought['lines'] = [];

    // FSM state mapping
    const stateEmoji: Record<string, string> = {
        'launch': '🚀',
        'profit': '💰',
        'defense': '🛡️',
        'rationing': '⚠️',
        'liquidation': '📉',
        'shadow': '👤'
    };

    // 1. Strategist: Active State
    if (entry.fsm_state) {
        const stateDisplay = entry.fsm_state.charAt(0).toUpperCase() + entry.fsm_state.slice(1);
        const objectives: Record<string, string> = {
            'launch': 'Maximize Impressions',
            'profit': 'Maximize TNP',
            'defense': 'Protect Market Share',
            'rationing': 'Preserve Inventory',
            'shadow': 'Observe Only'
        };
        lines.push({
            agent: 'Strategist',
            icon: '🎯',
            text: `Active State: ${stateDisplay} ${stateEmoji[entry.fsm_state] || ''} → ${objectives[entry.fsm_state] || 'Standard Operation'}`
        });
    }

    // 2. Sentinel: Stock Status
    if (entry.m_supply !== null) {
        const mPct = (entry.m_supply * 100).toFixed(0);
        let status: string;
        if (entry.m_supply >= 0.95) {
            status = `Stock Healthy (M=${mPct}%) - Full Throttle`;
        } else if (entry.m_supply >= 0.7) {
            status = `Stock Moderate (M=${mPct}%) - Normal Operations`;
        } else if (entry.m_supply >= 0.5) {
            status = `Stock Warning (M=${mPct}%) - Light Braking`;
        } else {
            status = `⚠️ Stock Critical (M=${mPct}%) - BRAKING APPLIED`;
        }
        lines.push({
            agent: 'Sentinel',
            icon: '🛡️',
            text: status
        });
    }

    // 3. Tactician: Opportunity Analysis
    if (entry.delta_p !== null) {
        let opportunity: string;
        if (entry.delta_p < 0.7) {
            opportunity = `🟢 Strong Buying Opportunity (ΔP=${entry.delta_p.toFixed(2)})`;
        } else if (entry.delta_p < 0.9) {
            opportunity = `🟢 Soft Auction Detected (ΔP=${entry.delta_p.toFixed(2)})`;
        } else if (entry.delta_p > 1.1) {
            opportunity = `🔴 Overheated Auction (ΔP=${entry.delta_p.toFixed(2)}) - Reduce Exposure`;
        } else {
            opportunity = `⚪ Neutral Market (ΔP=${entry.delta_p.toFixed(2)})`;
        }
        lines.push({
            agent: 'Tactician',
            icon: '🤖',
            text: opportunity
        });
    }

    // 4. Action: Final Decision
    const bidChange = entry.current_bid && entry.current_bid > 0
        ? ((entry.optimal_bid - entry.current_bid) / entry.current_bid * 100)
        : 0;

    let actionText: string;
    if (bidChange > 5) {
        actionText = `↑ Increasing bid for "${entry.keyword_text || 'target'}" (+${bidChange.toFixed(0)}%)`;
    } else if (bidChange < -5) {
        actionText = `↓ Decreasing bid for "${entry.keyword_text || 'target'}" (${bidChange.toFixed(0)}%)`;
    } else {
        actionText = `→ Maintaining bid for "${entry.keyword_text || 'target'}"`;
    }
    lines.push({
        agent: 'Action',
        icon: '⚡',
        text: actionText
    });

    return { lines };
};

// Legacy single-line version for compact view
const generateLogicTrace = (entry: ShadowLogEntry): string => {
    const cot = generateChainOfThought(entry);
    return cot.lines.slice(0, 2).map(l => l.text.split(' - ')[0]).join(' • ') || 'Standard optimization';
};

// Calculate bid direction and style
const getBidDirection = (current: number | null, optimal: number): { arrow: string; color: string; pct: string } => {
    if (!current || current === 0) {
        return { arrow: '→', color: 'text-gray-500 dark:text-gray-400', pct: 'N/A' };
    }

    const pctChange = ((optimal - current) / current) * 100;

    if (pctChange > 5) {
        return { arrow: '↑', color: 'text-success-400', pct: `+${pctChange.toFixed(0)}%` };
    } else if (pctChange < -5) {
        return { arrow: '↓', color: 'text-error-400', pct: `${pctChange.toFixed(0)}%` };
    }
    return { arrow: '→', color: 'text-gray-500 dark:text-gray-400', pct: `${pctChange.toFixed(0)}%` };
};

// Separate row component to properly use hooks
function TickerRow({ entry, index, onOpenContext }: { entry: ShadowLogEntry; index: number; onOpenContext: (entry: ShadowLogEntry) => void }) {
    const [expanded, setExpanded] = useState(false);

    const agent = getAgentInfo(entry.trigger, entry.fsm_state);
    const bid = getBidDirection(entry.current_bid, entry.optimal_bid);
    const chainOfThought = generateChainOfThought(entry);
    const logicTrace = generateLogicTrace(entry);

    return (
        <tr
            className={`
                border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors
                ${index === 0 ? 'bg-gray-100 dark:bg-gray-800/20' : ''}
            `}
        >
            {/* Timestamp */}
            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                {formatTime(entry.timestamp)}
            </td>

            {/* Agent */}
            <td className="px-3 py-2">
                <span className={`${agent.color}`}>
                    {agent.icon} {agent.name}
                </span>
            </td>

            {/* Target */}
            <td className="px-3 py-2">
                <div className="truncate max-w-[180px]" title={entry.keyword_text || entry.keyword_id}>
                    <span className="text-gray-700 dark:text-gray-300">
                        {entry.keyword_text || entry.keyword_id.substring(0, 12) + '...'}
                    </span>
                </div>
            </td>

            {/* The Trade */}
            <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                    <span className="text-gray-400 dark:text-gray-500">
                        ${entry.current_bid?.toFixed(2) || '-.--'}
                    </span>
                    <span className={`${bid.color} font-bold`}>
                        {bid.arrow}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                        ${entry.optimal_bid.toFixed(2)}
                    </span>
                    <span className={`${bid.color} text-[10px] ml-1`}>
                        {bid.pct}
                    </span>
                </div>
            </td>

            {/* Logic Trace - Chain of Thought */}
            <td className="px-3 py-2">
                <div
                    className="cursor-pointer group"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {!expanded ? (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 truncate block max-w-[350px]">
                                {logicTrace}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-[10px] group-hover:text-brand-400">▼</span>
                        </div>
                    ) : (
                        <div className="space-y-1 bg-gray-50 dark:bg-white/[0.03] rounded p-2 -mx-1">
                            {chainOfThought.lines.map((line, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px]">
                                    <span className="text-gray-400 dark:text-gray-500 shrink-0">{i + 1}.</span>
                                    <span className="text-brand-400 shrink-0">{line.agent}:</span>
                                    <span className="text-gray-700 dark:text-gray-300">{line.text}</span>
                                </div>
                            ))}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenContext(entry);
                                }}
                                className="mt-2 w-full text-center text-[10px] text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/10 rounded py-1 transition-colors"
                            >
                                🔍 VIEW FULL CONTEXT
                            </button>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-right pt-1">▲ click to collapse</div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default function LiveShadowTicker() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

    // Modal state for decision context
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedContext, setSelectedContext] = useState<DecisionContext | null>(null);

    // Build context from entry data
    const handleOpenContext = (entry: ShadowLogEntry) => {
        const deltaPct = entry.current_bid && entry.current_bid > 0
            ? ((entry.optimal_bid - entry.current_bid) / entry.current_bid) * 100
            : 0;

        const context: DecisionContext = {
            timestamp: entry.timestamp,
            keyword_id: entry.keyword_id,
            keyword_text: entry.keyword_text,
            bid: {
                optimal: entry.optimal_bid,
                current: entry.current_bid,
                delta_pct: deltaPct,
                reasoning: entry.trigger || null
            },
            strategist: {
                fsm_state: entry.fsm_state,
                objective: entry.fsm_state === 'profit' ? 'Maximize TNP'
                    : entry.fsm_state === 'launch' ? 'Maximize Impressions'
                        : entry.fsm_state === 'rationing' ? 'Preserve Inventory'
                            : entry.fsm_state === 'defense' ? 'Protect Market Share'
                                : 'Observe Only',
                confidence: 0.92
            },
            sentinel: {
                l_eff: 14,
                m_supply: entry.m_supply || 0.996,
                dos: 28,
                is_braking: (entry.m_supply || 1) < 0.5,
                dampening_pct: (entry.m_supply || 1) < 0.5 ? Math.round((1 - (entry.m_supply || 0)) * 100) : 0
            },
            semantic: {
                active_discoveries: 3,
                last_discovery: null,
                similarity: null
            }
        };

        setSelectedContext(context);
        setModalOpen(true);
    };

    // Auto-refresh query every 5 seconds
    const { data: logs, isLoading, error, dataUpdatedAt } = useQuery({
        queryKey: ['shadow-ticker'],
        queryFn: fetchShadowLogs,
        refetchInterval: isLive ? 5000 : false, // Poll every 5 seconds when live
        refetchIntervalInBackground: false,
    });

    // Track last update
    useEffect(() => {
        if (dataUpdatedAt) {
            setLastUpdateTime(new Date(dataUpdatedAt));
        }
    }, [dataUpdatedAt]);

    // Skeleton loader
    if (isLoading) {
        return (
            <section className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="animate-pulse space-y-2">
                    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
                    <div className="space-y-1">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-8 bg-gray-50 dark:bg-white/[0.03] rounded"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Error state
    if (error) {
        return (
            <section className="bg-gray-50 dark:bg-[#0a0a0a] border border-red-900/50 rounded-xl p-4">
                <div className="text-error-400 text-sm">
                    ⚠️ Failed to connect to shadow stream. Ensure backend is running.
                </div>
            </section>
        );
    }

    return (
        <section className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Header Bar */}
            <div className="bg-gray-100 dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-success-500 animate-pulse' : 'bg-gray-600'}`}></div>
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">LIVE SHADOW STREAM</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {logs?.length || 0} entries
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Last update indicator */}
                    {lastUpdateTime && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            Updated: {formatTime(lastUpdateTime.toISOString())}
                        </span>
                    )}

                    {/* Live toggle */}
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={`text-xs font-mono px-2 py-1 rounded transition-colors ${isLive
                            ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                            }`}
                    >
                        {isLive ? '● LIVE' : '○ PAUSED'}
                    </button>
                </div>
            </div>

            {/* Terminal Table */}
            <div
                ref={containerRef}
                className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
                <table className="w-full text-xs font-mono">
                    <thead className="bg-gray-100 dark:bg-[#0d0d0d] sticky top-0 z-10">
                        <tr className="text-gray-400 dark:text-gray-500 text-left">
                            <th className="px-3 py-2 w-20">TIME</th>
                            <th className="px-3 py-2 w-24">AGENT</th>
                            <th className="px-3 py-2 w-48">TARGET</th>
                            <th className="px-3 py-2 w-40">THE TRADE</th>
                            <th className="px-3 py-2">LOGIC TRACE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs?.map((entry, index) => (
                            <TickerRow
                                key={`${entry.keyword_id}-${entry.timestamp}-${index}`}
                                entry={entry}
                                index={index}
                                onOpenContext={handleOpenContext}
                            />
                        ))}

                        {/* Empty state */}
                        {(!logs || logs.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-2xl">📡</span>
                                        <span>Waiting for shadow decisions...</span>
                                        <span className="text-xs">The Cybernetic Pulse runs every 5 minutes</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Stats Bar */}
            <div className="bg-gray-100 dark:bg-[#0d0d0d] border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-4">
                    <span>🤖 Tactician: {logs?.filter(l => getAgentInfo(l.trigger, l.fsm_state).name === 'Tactician').length || 0}</span>
                    <span>🛡️ Sentinel: {logs?.filter(l => getAgentInfo(l.trigger, l.fsm_state).name === 'Sentinel').length || 0}</span>
                    <span>⚡ Pulse: {logs?.filter(l => getAgentInfo(l.trigger, l.fsm_state).name === 'Pulse').length || 0}</span>
                </div>
                <span className="text-gray-400 dark:text-gray-500">
                    Auto-refresh: {isLive ? '5s' : 'OFF'}
                </span>
            </div>

            {/* Decision Context Modal */}
            <DecisionContextModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                context={selectedContext}
            />
        </section>
    );
}
