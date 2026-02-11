'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAlphaReport } from '@/utils/api';
import type { AlphaReportResponse } from '@/utils/types';
import VerifiedSourceBadge from './VerifiedSourceBadge';
import MissedProfitTicker from './MissedProfitTicker';
import { BarChart3, TrendingUp, TrendingDown, Target, Gem, Flame } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════

function LoadingSkeleton() {
    return (
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] overflow-hidden animate-pulse">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-800 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded mb-4"></div>
                            <div className="h-12 w-48 bg-gray-100 dark:bg-gray-800 rounded"></div>
                        </div>
                        <div className="flex gap-6">
                            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
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
    const { data, isLoading, error } = useQuery({
        queryKey: ['alpha-report'],
        queryFn: fetchAlphaReport,
        refetchInterval: 30000,
        retry: 2,
    });

    if (isLoading) return <LoadingSkeleton />;

    if (error || !data || data.status === 'no_session') {
        return (
            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-8 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-500/10 mb-4">
                    <BarChart3 className="h-7 w-7 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Shadow Mode Not Active</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Start Shadow Mode to begin collecting profit alpha data.
                </p>
            </section>
        );
    }

    if (data.status === 'collecting') {
        return (
            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-8 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-warning-500/10 mb-4">
                    <Target className="h-7 w-7 text-warning-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Collecting Data...</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {data.message || 'Simulating bid decisions. Use the API to send bid requests.'}
                </p>
            </section>
        );
    }

    const { financials, summary, efficiency, reconciliation, success_fee } = data;

    const liveTNP = financials.live_baseline.profit;
    const shadowTNP = financials.shadow_intent.estimated_profit;
    const profitAlpha = summary.profit_alpha;
    const alphaPct = summary.alpha_pct;

    const FEE_RATE = success_fee.fee_rate_pct / 100;
    const successFee = success_fee.amount;

    return (
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] overflow-hidden">
            {/* Live Missed Profit Ticker */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <MissedProfitTicker />
            </div>

            {/* Hero: Total Net Profit Lift */}
            <div className="bg-success-500/5 border-b border-success-500/15 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm text-success-400 font-medium flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4" /> Profit Alpha (Backend Verified)
                                </span>
                                <VerifiedSourceBadge source="shadow" />
                            </div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl sm:text-5xl font-bold text-success-400 font-mono">
                                    +${profitAlpha.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xl sm:text-2xl text-success-500 flex items-center gap-1">
                                    <TrendingUp className="h-5 w-5" /> {alphaPct.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                Verified by backend: Shadow TNP - Live TNP = Profit Alpha
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="text-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] px-5 py-3">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Gem className="h-4 w-4 text-success-400" />
                                </div>
                                <div className="text-2xl font-bold text-success-400">{efficiency.hidden_gems_found}</div>
                                <div className="text-theme-xs text-gray-400 dark:text-gray-500">Hidden Gems</div>
                            </div>
                            <div className="text-center rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] px-5 py-3">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Flame className="h-4 w-4 text-error-400" />
                                </div>
                                <div className="text-2xl font-bold text-error-400">{efficiency.overheated_auctions_detected}</div>
                                <div className="text-theme-xs text-gray-400 dark:text-gray-500">Waste Prevented</div>
                            </div>
                        </div>
                    </div>

                    {/* TNP Comparison Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] p-4">
                            <div className="text-theme-xs text-gray-400 dark:text-gray-500 mb-2 font-medium">Live Baseline (Human)</div>
                            <div className="flex justify-between text-sm font-mono flex-wrap gap-2">
                                <span>Spend: <span className="text-gray-700 dark:text-gray-300">${financials.live_baseline.spend.toFixed(2)}</span></span>
                                <span>Sales: <span className="text-gray-700 dark:text-gray-300">${financials.live_baseline.sales.toFixed(2)}</span></span>
                                <span>TNP: <span className="text-gray-700 dark:text-gray-300">${liveTNP.toFixed(2)}</span></span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-success-500/20 bg-success-500/5 p-4">
                            <div className="text-theme-xs text-success-400 mb-2 font-medium">Shadow Intent (AI)</div>
                            <div className="flex justify-between text-sm font-mono flex-wrap gap-2">
                                <span>Predicted: <span className="text-success-300">${financials.shadow_intent.predicted_sales.toFixed(2)}</span></span>
                                <span>Est. TNP: <span className="text-success-300">${shadowTNP.toFixed(2)}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Fee Calculator */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-brand-400" /> Success Fee Calculation
                </h3>

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-4 font-mono text-sm">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Shadow TNP</span>
                            <span className="text-brand-400 font-bold">${shadowTNP.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">&minus; Live TNP</span>
                            <span className="text-gray-700 dark:text-gray-300">${liveTNP.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">= Profit Alpha</span>
                            <span className="text-success-400 font-bold">${profitAlpha.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">&times; Fee Rate</span>
                            <span className="text-gray-700 dark:text-gray-300">{(FEE_RATE * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between py-3 bg-success-500/5 rounded-lg px-3 -mx-3 border border-success-500/15">
                            <span className="text-success-400 font-bold">= Success Fee</span>
                            <span className="text-success-400 text-xl font-bold">${successFee.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-4 text-theme-xs text-gray-400 dark:text-gray-500 text-center">
                        Formula: {data.formula.profit_alpha_formula}
                    </div>
                </div>
            </div>

            {/* Readiness Status */}
            <div className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 font-medium">Go-Live Readiness</div>
                        <div className={`text-lg font-semibold ${summary.ready_for_live ? 'text-success-400' : 'text-warning-400'}`}>
                            {summary.recommendation}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        <span>Day {data.days_elapsed}/14</span>
                        <span className="text-gray-700">&bull;</span>
                        <span>Error: {reconciliation.avg_prediction_error_pct.toFixed(1)}%</span>
                        <span className="text-gray-700">&bull;</span>
                        <span className={`px-2.5 py-1 rounded-md text-theme-xs font-semibold border ${summary.confidence === 'HIGH' ? 'bg-success-500/10 text-success-400 border-success-500/20' :
                            summary.confidence === 'MEDIUM' ? 'bg-warning-500/10 text-warning-400 border-warning-500/20' :
                                'bg-error-500/10 text-error-400 border-error-500/20'
                            }`}>
                            {summary.confidence}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
