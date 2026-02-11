'use client';

import React from 'react';

/**
 * Decision Context Modal
 * ======================
 * Shows the full "Why" behind a bid decision.
 * Displays agent states at the exact timestamp the bid was made.
 */

export interface DecisionContext {
    timestamp: string;
    keyword_id: string;
    keyword_text: string | null;
    bid: {
        optimal: number;
        current: number | null;
        delta_pct: number;
        reasoning: string | null;
    };
    strategist: {
        fsm_state: string;
        objective: string;
        confidence: number;
    };
    sentinel: {
        l_eff: number;
        m_supply: number;
        dos: number;
        is_braking: boolean;
        dampening_pct: number;
    };
    semantic: {
        active_discoveries: number;
        last_discovery: string | null;
        similarity: number | null;
    };
}

interface DecisionContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: DecisionContext | null;
    loading?: boolean;
}

// FSM state styling
const getStateStyle = (state: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
        launch: { bg: 'bg-brand-500/10', text: 'text-blue-light-400', icon: '🚀' },
        profit: { bg: 'bg-success-500/10', text: 'text-success-400', icon: '💰' },
        defense: { bg: 'bg-warning-500/10', text: 'text-warning-400', icon: '🛡️' },
        rationing: { bg: 'bg-error-500/10', text: 'text-error-400', icon: '⚠️' },
        liquidation: { bg: 'bg-brand-500/10', text: 'text-brand-400', icon: '📉' },
        shadow: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '👤' },
    };
    return styles[state.toLowerCase()] || { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '📊' };
};

// Format timestamp to local time
const formatTime = (isoString: string): string => {
    try {
        const hasTimezone = isoString.endsWith('Z') ||
            /[+-]\d{2}:\d{2}$/.test(isoString) ||
            /[+-]\d{4}$/.test(isoString);
        const utcString = hasTimezone ? isoString : isoString + 'Z';
        const date = new Date(utcString);
        if (isNaN(date.getTime())) return '--:--:--';
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

export default function DecisionContextModal({
    isOpen,
    onClose,
    context,
    loading
}: DecisionContextModalProps) {
    if (!isOpen) return null;

    const stateStyle = context ? getStateStyle(context.strategist.fsm_state) : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-white dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🔍</span>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Decision Context</h2>
                                {context && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                        {formatTime(context.timestamp)} • {context.keyword_id}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="p-8 flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                        </div>
                    ) : context ? (
                        <div className="p-6 space-y-6">
                            {/* Target Keyword */}
                            <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Target Keyword</div>
                                <div className="text-lg font-mono text-gray-900 dark:text-white">
                                    "{context.keyword_text || context.keyword_id}"
                                </div>
                            </div>

                            {/* The Decision */}
                            <div className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-wider text-brand-400 mb-3">⚡ The Decision</div>
                                <div className="flex items-center gap-4 mb-3">
                                    <div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">Current Bid</div>
                                        <div className="text-xl font-mono text-gray-500 dark:text-gray-400">
                                            ${context.bid.current?.toFixed(2) || '-.--'}
                                        </div>
                                    </div>
                                    <div className={`text-2xl ${context.bid.delta_pct > 0 ? 'text-success-400' : 'text-error-400'}`}>
                                        →
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">AI Optimal</div>
                                        <div className="text-xl font-mono text-success-400">
                                            ${context.bid.optimal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className={`text-sm font-bold px-2 py-1 rounded ${context.bid.delta_pct > 0 ? 'bg-success-500/10 text-success-400' : 'bg-error-500/10 text-error-400'
                                        }`}>
                                        {context.bid.delta_pct > 0 ? '+' : ''}{context.bid.delta_pct.toFixed(1)}%
                                    </div>
                                </div>
                                {context.bid.reasoning && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.03] rounded p-3 font-mono">
                                        {context.bid.reasoning}
                                    </div>
                                )}
                            </div>

                            {/* Agent Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Strategist */}
                                <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span>🎯</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">STRATEGIST</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${stateStyle?.bg} mb-3`}>
                                        <span>{stateStyle?.icon}</span>
                                        <span className={`font-bold uppercase text-sm ${stateStyle?.text}`}>
                                            {context.strategist.fsm_state}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-gray-500">Objective</span>
                                            <span className="text-gray-700 dark:text-gray-300">{context.strategist.objective}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-gray-500">Confidence</span>
                                            <span className="text-gray-700 dark:text-gray-300">{(context.strategist.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sentinel */}
                                <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span>🛡️</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">SENTINEL</span>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 ${context.sentinel.is_braking
                                            ? 'bg-error-500/10 text-error-400'
                                            : 'bg-success-500/10 text-success-400'
                                        }`}>
                                        <span>{context.sentinel.is_braking ? '🔴' : '🟢'}</span>
                                        <span className="font-bold text-sm">
                                            {context.sentinel.is_braking ? 'BRAKING' : 'HEALTHY'}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-gray-500">M<sub>supply</sub></span>
                                            <span className={`font-mono ${context.sentinel.m_supply >= 0.9 ? 'text-success-400' :
                                                    context.sentinel.m_supply >= 0.5 ? 'text-warning-400' : 'text-error-400'
                                                }`}>
                                                {(context.sentinel.m_supply * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-gray-500">DoS</span>
                                            <span className="text-gray-700 dark:text-gray-300 font-mono">{context.sentinel.dos}d</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-gray-500">L<sub>eff</sub></span>
                                            <span className="text-gray-700 dark:text-gray-300 font-mono">{context.sentinel.l_eff}d</span>
                                        </div>
                                        {context.sentinel.is_braking && (
                                            <div className="text-error-400 mt-2 text-[10px]">
                                                ⚠️ Dampening by {context.sentinel.dampening_pct}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Semantic */}
                                <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span>👁️</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">SEMANTIC</span>
                                    </div>
                                    <div className="text-2xl font-bold text-brand-400 font-mono mb-2">
                                        {context.semantic.active_discoveries}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">discoveries active</div>
                                    {context.semantic.last_discovery && (
                                        <div className="text-xs bg-purple-900/20 border border-purple-800/30 rounded p-2">
                                            <div className="text-brand-300 font-mono truncate">
                                                "{context.semantic.last_discovery}"
                                            </div>
                                            {context.semantic.similarity !== null && (
                                                <div className="text-gray-400 dark:text-gray-500 mt-1">
                                                    Similarity: {(context.semantic.similarity * 100).toFixed(0)}%
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Causal Chain */}
                            <div className="bg-gray-100/50 dark:bg-gray-800/20 border border-gray-300 dark:border-gray-700 rounded-xl p-4">
                                <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">🔗 Causal Chain</div>
                                <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto">
                                    <span className="bg-brand-500/10 text-blue-light-400 px-2 py-1 rounded">
                                        🎯 Strategist: {context.strategist.fsm_state.toUpperCase()}
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="bg-warning-500/10 text-warning-400 px-2 py-1 rounded">
                                        🛡️ Sentinel: M={(context.sentinel.m_supply * 100).toFixed(0)}%
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="bg-success-500/10 text-success-400 px-2 py-1 rounded">
                                        🤖 Tactician: ${context.bid.optimal.toFixed(2)}
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="bg-brand-500/10 text-brand-400 px-2 py-1 rounded">
                                        ⚡ Executor: LOGGED
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                            No context available
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
