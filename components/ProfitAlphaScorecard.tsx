'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAlphaReport } from '@/utils/api';
import type { AlphaReportResponse } from '@/utils/types';
import VerifiedSourceBadge from './VerifiedSourceBadge';
import MissedProfitTicker from './MissedProfitTicker';

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════

function LoadingSkeleton() {
    return (
        <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
            <div className="p-4 border-b border-slate-800/50">
                <div className="h-12 bg-slate-800 rounded-xl"></div>
            </div>
            <div className="bg-gradient-to-r from-slate-800/50 to-[#121212] border-b border-slate-700/20 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-4 w-32 bg-slate-700 rounded mb-4"></div>
                            <div className="h-12 w-48 bg-slate-700 rounded"></div>
                        </div>
                        <div className="flex gap-6">
                            <div className="h-16 w-16 bg-slate-700 rounded-lg"></div>
                            <div className="h-16 w-16 bg-slate-700 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT — API-DRIVEN (NO FRONTEND CALCULATIONS)
// ═══════════════════════════════════════════════════════════════

export default function ProfitAlphaScorecard() {
    // React Query with 30s refetch — ALL DATA FROM BACKEND
    const { data, isLoading, error } = useQuery({
        queryKey: ['alpha-report'],
        queryFn: fetchAlphaReport,
        refetchInterval: 30000,
        retry: 2,
    });

    // Show skeleton while loading
    if (isLoading) return <LoadingSkeleton />;

    // Handle error or no session state
    if (error || !data || data.status === 'no_session') {
        return (
            <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-white mb-2">Shadow Mode Not Active</h3>
                <p className="text-slate-400 text-sm">
                    Start Shadow Mode to begin collecting profit alpha data.
                </p>
            </section>
        );
    }

    // Handle collecting state (no bids yet)
    if (data.status === 'collecting') {
        return (
            <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4 animate-pulse">⏳</div>
                <h3 className="text-lg font-bold text-white mb-2">Collecting Data...</h3>
                <p className="text-slate-400 text-sm">
                    {data.message || 'Simulating bid decisions. Use the API to send bid requests.'}
                </p>
            </section>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ALL VALUES READ DIRECTLY FROM BACKEND — NO FRONTEND MATH
    // ═══════════════════════════════════════════════════════════════

    const { financials, summary, efficiency, reconciliation, success_fee } = data;

    // Backend-calculated values (READ-ONLY)
    const liveTNP = financials.live_baseline.profit;
    const shadowTNP = financials.shadow_intent.estimated_profit;
    const profitAlpha = summary.profit_alpha;
    const alphaPct = summary.alpha_pct;

    // Success Fee from backend (Math Sovereignty)
    const FEE_RATE = success_fee.fee_rate_pct / 100;
    const successFee = success_fee.amount;

    return (
        <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
            {/* Live Missed Profit Ticker */}
            <div className="p-4 border-b border-slate-800/50">
                <MissedProfitTicker />
            </div>

            {/* Hero: Total Net Profit Lift */}
            <div className="bg-gradient-to-r from-emerald-900/50 via-emerald-800/30 to-[#121212] border-b border-emerald-500/20 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm text-emerald-400 font-medium font-inter">💰 Profit Alpha (Backend Verified)</span>
                                <VerifiedSourceBadge source="shadow" />
                            </div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-5xl font-bold text-emerald-400 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                    +${profitAlpha.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-2xl text-emerald-500">↑ {alphaPct.toFixed(1)}%</span>
                            </div>
                            <p className="text-slate-400 text-sm mt-2">
                                Verified by backend: Shadow TNP - Live TNP = Profit Alpha
                            </p>
                        </div>

                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-emerald-400">{efficiency.hidden_gems_found}</div>
                                <div className="text-xs text-slate-500">Hidden Gems</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-400">{efficiency.overheated_auctions_detected}</div>
                                <div className="text-xs text-slate-500">Waste Prevented</div>
                            </div>
                        </div>
                    </div>

                    {/* TNP Comparison Cards */}
                    <div className="grid grid-cols-2 gap-6 mt-6">
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <div className="text-xs text-slate-500 mb-2">Live Baseline (Human)</div>
                            <div className="flex justify-between text-sm font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                <span>Spend: <span className="text-slate-300">${financials.live_baseline.spend.toFixed(2)}</span></span>
                                <span>Sales: <span className="text-slate-300">${financials.live_baseline.sales.toFixed(2)}</span></span>
                                <span>TNP: <span className="text-slate-300">${liveTNP.toFixed(2)}</span></span>
                            </div>
                        </div>
                        <div className="bg-emerald-900/30 border border-emerald-500/20 rounded-xl p-4">
                            <div className="text-xs text-emerald-400 mb-2">Shadow Intent (AI)</div>
                            <div className="flex justify-between text-sm font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                <span>Predicted: <span className="text-emerald-300">${financials.shadow_intent.predicted_sales.toFixed(2)}</span></span>
                                <span>Est. TNP: <span className="text-emerald-300">${shadowTNP.toFixed(2)}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Fee Calculator */}
            <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 font-inter">
                    <span>📋</span> Success Fee Calculation
                </h3>

                <div className="bg-[#1a1a1a] rounded-xl p-4 font-mono text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {/* Step-by-step formula display */}
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">Shadow TNP</span>
                            <span className="text-purple-400 font-bold">${shadowTNP.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">− Live TNP</span>
                            <span className="text-slate-300">${liveTNP.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">= Profit Alpha</span>
                            <span className="text-emerald-400 font-bold">${profitAlpha.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">× Fee Rate</span>
                            <span className="text-slate-300">{(FEE_RATE * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between py-3 bg-emerald-900/20 rounded-lg px-3 -mx-3">
                            <span className="text-emerald-400 font-bold">= Success Fee</span>
                            <span className="text-emerald-400 text-xl font-bold">${successFee.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-500 text-center">
                        Formula: {data.formula.profit_alpha_formula}
                    </div>
                </div>
            </div>

            {/* Readiness Status */}
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Go-Live Readiness</div>
                        <div className={`text-lg font-bold ${summary.ready_for_live ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {summary.recommendation}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Day {data.days_elapsed}/14</span>
                        <span>•</span>
                        <span>Error: {reconciliation.avg_prediction_error_pct.toFixed(1)}%</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${summary.confidence === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' :
                            summary.confidence === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                            {summary.confidence}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
