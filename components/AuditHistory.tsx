'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/utils/api';

interface BidLog {
    id: number;
    timestamp: string;
    keyword_id: string;
    keyword?: string;
    optimal_bid: number;
    live_bid: number;
    fsm_state: string;
    m_supply: number;
    delta_p?: number;
    reason?: string;
}

export default function AuditHistory() {
    const [bids, setBids] = useState<BidLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchBids();
    }, [page]);

    const fetchBids = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/shadow/bids?limit=${pageSize * page}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setBids(data.bids || []);
                // Estimate total pages based on count
                setTotalPages(Math.max(1, Math.ceil((data.count || 1) / pageSize)));
            }
        } catch (error) {
            console.error('Failed to fetch audit history:', error);
        } finally {
            setLoading(false);
        }
    };

    const stateColors: Record<string, string> = {
        launch: 'bg-blue-500',
        profit: 'bg-success-500',
        PROFIT: 'bg-success-500',
        defense: 'bg-orange-500',
        DEFENSE: 'bg-orange-500',
        rationing: 'bg-warning-500',
        RATIONING: 'bg-warning-500',
        liquidation: 'bg-error-500',
        LIQUIDATION: 'bg-error-500',
        LAUNCH: 'bg-blue-500',
    };

    const formatTimestamp = (timestamp: string) => {
        // Check if timestamp already has timezone info
        const hasTimezone = timestamp.endsWith('Z') ||
            /[+-]\d{2}:\d{2}$/.test(timestamp) ||
            /[+-]\d{4}$/.test(timestamp);

        // If no timezone, assume UTC and append 'Z'
        const utcString = hasTimezone ? timestamp : timestamp + 'Z';
        const date = new Date(utcString);

        if (isNaN(date.getTime())) return '--';

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-950 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📜</span>
                    <h2 className="text-lg font-bold">Audit History</h2>
                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-600/30 text-gray-500 dark:text-gray-400 rounded text-xs">
                        shadow_bid_logs
                    </span>
                </div>
                <button
                    onClick={fetchBids}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
            ) : bids.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">No bid logs yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Start Shadow Mode and run bid simulations to see audit entries here.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                    <th className="text-left py-3 px-4">Timestamp</th>
                                    <th className="text-left py-3 px-4">Keyword ID</th>
                                    <th className="text-right py-3 px-4">Optimal Bid</th>
                                    <th className="text-right py-3 px-4">Live Bid</th>
                                    <th className="text-center py-3 px-4">FSM State</th>
                                    <th className="text-right py-3 px-4">M<sub>supply</sub></th>
                                    <th className="text-right py-3 px-4">ΔP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bids.slice((page - 1) * pageSize, page * pageSize).map((bid, index) => {
                                    // Defensive: ensure numeric values exist
                                    const optimalBid = bid.optimal_bid ?? 0;
                                    const liveBid = bid.live_bid ?? 0;
                                    const mSupply = bid.m_supply ?? 0;

                                    const alphaDelta = liveBid > 0 ? ((optimalBid - liveBid) / liveBid * 100) : 0;
                                    const isPositive = alphaDelta > 0;

                                    return (
                                        <tr
                                            key={bid.id || index}
                                            className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3 px-4 font-mono text-gray-500 dark:text-gray-400 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                {formatTimestamp(bid.timestamp)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-gray-900 dark:text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {bid.keyword_id || '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-brand-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                ${optimalBid.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-gray-500 dark:text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                ${liveBid.toFixed(2)}
                                                <span className={`ml-2 text-xs ${isPositive ? 'text-success-400' : 'text-error-400'}`}>
                                                    ({isPositive ? '+' : ''}{alphaDelta.toFixed(1)}%)
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${stateColors[bid.fsm_state] || 'bg-gray-500'}`}>
                                                    {bid.fsm_state || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                <span className={`${mSupply > 0.7 ? 'text-success-400' : mSupply > 0.3 ? 'text-warning-400' : 'text-error-400'}`}>
                                                    {mSupply.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                {bid.delta_p != null ? (
                                                    <span className={bid.delta_p < 1 ? 'text-success-400' : 'text-orange-400'}>
                                                        {bid.delta_p.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, bids.length)} of {bids.length} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded text-sm"
                            >
                                ← Prev
                            </button>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded text-sm"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
