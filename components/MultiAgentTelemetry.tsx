'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/utils/api';

/**
 * Multi-Agent Decision Trace
 * ==========================
 * Exposes non-keyword intelligence from all agents:
 * 
 * 1. Strategist (The Head) - Current Mission & FSM State
 * 2. Sentinel (The Brake) - Supply Pulse & Dampening Status
 * 3. Semantic (The Eye) - Discovery Events & Anomalies
 */

interface StrategistMission {
    fsm_state: string;
    objective: string;
    confidence: number;
    last_transition: string | null;
    delegation_orders: Record<string, string>;
    // Stability tracking for hysteresis
    days_in_state: number;
    required_days: number; // T_persistence
    is_stable: boolean;
}

interface SentinelPulse {
    l_eff: number;
    m_supply: number;
    dos: number;
    is_braking: boolean;
    dampening_pct: number;
    status: string;
    current_stock?: number;
    inbound_stock?: number;
}

interface SemanticDiscovery {
    timestamp: string;
    term: string;
    similarity: number;
    action: 'flagged' | 'promoted' | 'ignored';
    reason: string;
    // Discovery to Action Pipeline status
    harvest_status: 'PENDING_HARVEST' | 'AUTO_HARVESTED' | 'MANUAL_HARVESTED' | 'REVIEW_REQUIRED' | 'SKIPPED';
}

interface AgentTelemetry {
    strategist: StrategistMission;
    sentinel: SentinelPulse;
    semantic: {
        discoveries: SemanticDiscovery[];
        total_analyzed: number;
    };
}

// Mock data for demonstration (will be replaced with API)
const fetchAgentTelemetry = async (): Promise<AgentTelemetry> => {
    try {
        // Try to fetch from backend
        const res = await fetch(`${API_BASE}/agents/telemetry`, { credentials: 'include' });
        if (res.ok) {
            return await res.json();
        }
    } catch {
        // Fall through to mock data
    }

    // Return mock data if endpoint not available
    return {
        strategist: {
            fsm_state: 'profit',
            objective: 'Maximize TNP',
            confidence: 0.92,
            last_transition: '2h ago: launch → profit',
            delegation_orders: {
                tactician: 'Aggressive bid scaling allowed',
                sentinel: 'Normal inventory monitoring',
                semantic: 'Continue keyword discovery'
            },
            days_in_state: 5,
            required_days: 7,
            is_stable: false
        },
        sentinel: {
            l_eff: 14,
            m_supply: 0.996,
            dos: 28,
            is_braking: false,
            dampening_pct: 0,
            status: 'Healthy Stock - Full Throttle',
            current_stock: 1542,
            inbound_stock: 500
        },
        semantic: {
            discoveries: [
                {
                    timestamp: new Date().toISOString(),
                    term: 'projektor für handy',
                    similarity: 0.89,
                    action: 'promoted',
                    reason: 'High relevance to core products',
                    harvest_status: 'AUTO_HARVESTED'
                },
                {
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    term: 'beamer günstig',
                    similarity: 0.72,
                    action: 'flagged',
                    reason: 'Moderate relevance, needs review',
                    harvest_status: 'REVIEW_REQUIRED'
                },
                {
                    timestamp: new Date(Date.now() - 600000).toISOString(),
                    term: 'laptop ständer',
                    similarity: 0.45,
                    action: 'ignored',
                    reason: 'Low similarity < 0.70 threshold',
                    harvest_status: 'SKIPPED'
                },
                {
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    term: 'mini beamer bluetooth',
                    similarity: 0.91,
                    action: 'promoted',
                    reason: 'High relevance, awaiting harvest',
                    harvest_status: 'PENDING_HARVEST'
                }
            ],
            total_analyzed: 127
        }
    };
};

// FSM State styling
const getStateStyle = (state: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
        launch: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🚀' },
        profit: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: '💰' },
        defense: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '🛡️' },
        rationing: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '⚠️' },
        liquidation: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '📉' }
    };
    return styles[state.toLowerCase()] || { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: '📊' };
};

// Format timestamp (convert UTC to local timezone)
const formatTime = (isoString: string): string => {
    try {
        // Check if timestamp already has timezone info
        const hasTimezone = isoString.endsWith('Z') ||
            /[+-]\d{2}:\d{2}$/.test(isoString) ||
            /[+-]\d{4}$/.test(isoString);

        // If no timezone, assume UTC and append 'Z'
        const utcString = hasTimezone ? isoString : isoString + 'Z';
        const date = new Date(utcString);

        if (isNaN(date.getTime())) return '--:--';

        return date.toLocaleTimeString('de-DE', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '--:--';
    }
};

export default function MultiAgentTelemetry() {
    const [expandedSection, setExpandedSection] = useState<string | null>('strategist');

    const { data: telemetry, isLoading } = useQuery({
        queryKey: ['agent-telemetry'],
        queryFn: fetchAgentTelemetry,
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    if (isLoading || !telemetry) {
        return (
            <section className="bg-[#0a0a0a] border border-slate-800 rounded-xl p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-slate-800/50 rounded"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const stateStyle = getStateStyle(telemetry.strategist.fsm_state);

    return (
        <section className="bg-[#0a0a0a] border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#0d0d0d] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-lg">🧠</span>
                    <span className="text-sm font-mono text-slate-300">MULTI-AGENT DECISION TRACE</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    All Agents Online
                </div>
            </div>

            {/* Agent Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">

                {/* === STRATEGIST (The Head) === */}
                <div
                    className={`p-4 cursor-pointer transition-colors ${expandedSection === 'strategist' ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}`}
                    onClick={() => setExpandedSection(expandedSection === 'strategist' ? null : 'strategist')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            <span className="text-sm font-bold text-slate-200">STRATEGIST</span>
                        </div>
                        <span className="text-xs text-slate-500">The Head</span>
                    </div>

                    {/* Current Mission Header */}
                    <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Current Mission</div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${stateStyle.bg}`}>
                            <span>{stateStyle.icon}</span>
                            <span className={`font-bold uppercase text-sm ${stateStyle.text}`}>
                                {telemetry.strategist.fsm_state}
                            </span>
                        </div>
                    </div>

                    {/* Objective Function */}
                    <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Objective Function</div>
                        <div className="text-emerald-400 font-mono text-sm">
                            f(x) = {telemetry.strategist.objective}
                        </div>
                    </div>

                    {/* STABILITY METER - T_persistence tracking */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500">Stability Meter</div>
                            <div className="group relative">
                                <span className="text-[10px] text-slate-600 cursor-help">ⓘ</span>
                                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[9px] text-slate-300 whitespace-nowrap z-10">
                                    T<sub>persistence</sub> = {telemetry.strategist.required_days} days required before state is confirmed stable
                                </div>
                            </div>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${telemetry.strategist.is_stable
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                    }`}
                                style={{ width: `${Math.min(100, (telemetry.strategist.days_in_state / telemetry.strategist.required_days) * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className={`text-xs font-mono ${telemetry.strategist.is_stable ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                {telemetry.strategist.days_in_state}/{telemetry.strategist.required_days} days
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${telemetry.strategist.is_stable
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {telemetry.strategist.is_stable ? '✓ STABLE' : '⏳ STABILIZING'}
                            </span>
                        </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedSection === 'strategist' && (
                        <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Confidence</span>
                                <span className="text-slate-300">{(telemetry.strategist.confidence * 100).toFixed(0)}%</span>
                            </div>
                            {telemetry.strategist.last_transition && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Last Transition</span>
                                    <span className="text-slate-300">{telemetry.strategist.last_transition}</span>
                                </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Delegation Orders</div>
                                {Object.entries(telemetry.strategist.delegation_orders).map(([agent, order]) => (
                                    <div key={agent} className="flex gap-2 text-xs mb-1">
                                        <span className="text-slate-400 capitalize">{agent}:</span>
                                        <span className="text-slate-300">{order}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* === SENTINEL (The Brake) === */}
                <div
                    className={`p-4 cursor-pointer transition-colors ${expandedSection === 'sentinel' ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}`}
                    onClick={() => setExpandedSection(expandedSection === 'sentinel' ? null : 'sentinel')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🛡️</span>
                            <span className="text-sm font-bold text-slate-200">SENTINEL</span>
                        </div>
                        <span className="text-xs text-slate-500">The Brake</span>
                    </div>

                    {/* Supply Pulse Indicator */}
                    <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Supply Pulse</div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${telemetry.sentinel.is_braking
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                            <span>{telemetry.sentinel.is_braking ? '🔴' : '🟢'}</span>
                            <span className="font-bold text-sm">
                                {telemetry.sentinel.is_braking ? 'BRAKING' : 'HEALTHY'}
                            </span>
                        </div>
                    </div>

                    {/* Braking Warning */}
                    {telemetry.sentinel.is_braking && (
                        <div className="mb-3 p-2 bg-red-900/30 border border-red-800/50 rounded text-xs text-red-300">
                            ⚠️ Sentinel is Dampening Bids by {telemetry.sentinel.dampening_pct}%
                        </div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500">L<sub>eff</sub></div>
                            <div className="text-xl font-bold text-slate-200 font-mono">
                                {telemetry.sentinel.l_eff}d
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500">M<sub>supply</sub></div>
                            <div className={`text-xl font-bold font-mono ${telemetry.sentinel.m_supply >= 0.9 ? 'text-emerald-400' :
                                telemetry.sentinel.m_supply >= 0.5 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {(telemetry.sentinel.m_supply * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedSection === 'sentinel' && (
                        <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Days of Supply (DoS)</span>
                                <span className="text-slate-300">{telemetry.sentinel.dos.toFixed(1)} days</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Current Stock</span>
                                <span className="text-slate-300">{telemetry.sentinel.current_stock?.toLocaleString() || '--'} units</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Inbound</span>
                                <span className="text-slate-300">{telemetry.sentinel.inbound_stock?.toLocaleString() || '--'} units</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Status</span>
                                <span className="text-slate-300">{telemetry.sentinel.status}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Sigmoid Formula</div>
                                <div className="text-xs font-mono text-slate-400 bg-slate-800/50 p-2 rounded">
                                    M = 1 / (1 + e^(-k(DoS - L_eff)))
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* === SEMANTIC (The Eye) === */}
                <div
                    className={`p-4 cursor-pointer transition-colors ${expandedSection === 'semantic' ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}`}
                    onClick={() => setExpandedSection(expandedSection === 'semantic' ? null : 'semantic')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">👁️</span>
                            <span className="text-sm font-bold text-slate-200">SEMANTIC</span>
                        </div>
                        <span className="text-xs text-slate-500">The Eye</span>
                    </div>

                    {/* Discovery Counter */}
                    <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Semantic Discovery</div>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-purple-400 font-mono">
                                {telemetry.semantic.discoveries.length}
                            </div>
                            <div className="text-xs text-slate-500">
                                discoveries / {telemetry.semantic.total_analyzed} analyzed
                            </div>
                        </div>
                    </div>

                    {/* Latest Discovery */}
                    {telemetry.semantic.discoveries.length > 0 && (
                        <div className="p-2 bg-purple-900/20 border border-purple-800/30 rounded">
                            <div className="text-xs text-purple-300 font-mono truncate">
                                "{telemetry.semantic.discoveries[0].term}"
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                Similarity: {(telemetry.semantic.discoveries[0].similarity * 100).toFixed(0)}%
                            </div>
                        </div>
                    )}

                    {/* Expanded Details - Discovery Log */}
                    {expandedSection === 'semantic' && (
                        <div className="mt-4 pt-3 border-t border-slate-700">
                            {/* Eye → Hand Pipeline Header */}
                            <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500">
                                <span className="uppercase tracking-wider">Discovery Pipeline</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                    👁️ The Eye → 🤖 → ✋ The Hand
                                </span>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {telemetry.semantic.discoveries.map((discovery, idx) => {
                                    // Harvest status styling
                                    const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
                                        'PENDING_HARVEST': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '⏳ PENDING' },
                                        'AUTO_HARVESTED': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '✓ HARVESTED' },
                                        'MANUAL_HARVESTED': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '👤 MANUAL' },
                                        'REVIEW_REQUIRED': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '? REVIEW' },
                                        'SKIPPED': { bg: 'bg-slate-500/20', text: 'text-slate-400', label: '✗ SKIPPED' }
                                    };
                                    const status = statusStyles[discovery.harvest_status] || statusStyles['SKIPPED'];

                                    return (
                                        <div key={idx} className="flex items-start gap-2 text-xs p-2 bg-slate-800/30 rounded">
                                            <span className={`mt-0.5 ${discovery.action === 'promoted' ? 'text-emerald-400' :
                                                discovery.action === 'flagged' ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                {discovery.action === 'promoted' ? '✓' :
                                                    discovery.action === 'flagged' ? '?' : '✗'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-slate-300 truncate">"{discovery.term}"</span>
                                                    {/* Harvest Status Badge */}
                                                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${status.bg} ${status.text}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="text-slate-500 text-[10px] mt-1">
                                                    {formatTime(discovery.timestamp)} • Sim: {(discovery.similarity * 100).toFixed(0)}%
                                                </div>
                                                <div className="text-slate-400 text-[10px]">{discovery.reason}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pipeline Summary */}
                            <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-between text-[10px]">
                                <span className="text-slate-500">
                                    ⚡ {telemetry.semantic.discoveries.filter(d => d.harvest_status === 'AUTO_HARVESTED').length} auto-harvested
                                </span>
                                <span className="text-amber-400">
                                    ⏳ {telemetry.semantic.discoveries.filter(d => d.harvest_status === 'PENDING_HARVEST').length} pending
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
