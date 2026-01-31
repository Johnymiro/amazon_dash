'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAlphaReport } from '@/utils/api';
import type { AlphaReportResponse } from '@/utils/types';

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════

function LoadingSkeleton() {
    return (
        <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
            <div className="p-6 border-b border-slate-800">
                <div className="h-8 w-48 bg-slate-700 rounded"></div>
            </div>
            <div className="p-6">
                <div className="h-32 bg-slate-800 rounded-xl mb-6"></div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-slate-800 rounded-xl"></div>
                    <div className="h-24 bg-slate-800 rounded-xl"></div>
                    <div className="h-24 bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT — API-DRIVEN (NO FRONTEND CALCULATIONS)
// All success fee math is computed on the backend
// ═══════════════════════════════════════════════════════════════

export default function ProfitCalculator() {
    // React Query with 30s refresh — ALL DATA FROM BACKEND
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['alpha-report-billing'],
        queryFn: fetchAlphaReport,
        refetchInterval: 30000,
        retry: 2,
    });

    if (isLoading) return <LoadingSkeleton />;

    if (error || !data || data.status !== 'success') {
        return (
            <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-lg font-bold text-white mb-2">No Billing Data Available</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Start Shadow Mode to calculate profit-aligned billing.
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                >
                    ↻ Retry
                </button>
            </section>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ALL VALUES READ DIRECTLY FROM BACKEND — NO FRONTEND MATH
    // ═══════════════════════════════════════════════════════════════

    const { financials, summary, success_fee } = data;

    // Backend-calculated values (READ-ONLY)
    const shadowTNP = financials.shadow_intent.estimated_profit;
    const liveTNP = financials.live_baseline.profit;
    const profitAlpha = summary.profit_alpha;
    const feeRate = success_fee.fee_rate_pct;
    const successFeeAmount = success_fee.amount;
    const netProfit = success_fee.net_profit;
    const roi = success_fee.roi;

    return (
        <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                            <h2 className="text-lg font-bold font-inter">Profit-Aligned Billing</h2>
                            <p className="text-xs text-slate-500">Success Fee Preview • Backend Verified</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF9F]/10 border border-[#00FF9F]/30 rounded-lg">
                        <span className="text-[10px] text-[#00FF9F]">💡 PAY ONLY ON NEW MONEY</span>
                    </div>
                </div>
            </div>

            {/* Main Calculator */}
            <div className="p-6">
                {/* Formula Visualization */}
                <div className="mb-6 p-4 bg-[#1a1a1a] rounded-xl border border-slate-700/50">
                    <div className="text-xs text-slate-500 mb-3">SUCCESS FEE FORMULA (Backend Calculated)</div>
                    <div className="flex items-center justify-center gap-4 text-lg font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                        <div className="text-center">
                            <div className="text-purple-400 font-bold">${shadowTNP.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500">Shadow TNP</div>
                        </div>
                        <span className="text-slate-500">−</span>
                        <div className="text-center">
                            <div className="text-slate-400 font-bold">${liveTNP.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500">Live TNP</div>
                        </div>
                        <span className="text-slate-500">=</span>
                        <div className="text-center">
                            <div className="text-[#00FF9F] font-bold">${profitAlpha.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500">Profit Alpha</div>
                        </div>
                        <span className="text-slate-500">×</span>
                        <div className="text-center">
                            <div className="text-amber-400 font-bold">{feeRate}%</div>
                            <div className="text-[10px] text-slate-500">Fee Rate</div>
                        </div>
                        <span className="text-slate-500">=</span>
                        <div className="text-center">
                            <div className="text-[#00FF9F] font-bold text-2xl">${successFeeAmount.toFixed(2)}</div>
                            <div className="text-[10px] text-[#00FF9F]">Success Fee</div>
                        </div>
                    </div>
                </div>

                {/* Breakdown Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Profit Alpha (What You Earned) */}
                    <div className="p-4 bg-[#00FF9F]/10 border border-[#00FF9F]/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📈</span>
                            <span className="text-xs text-[#00FF9F]">NEW MONEY GENERATED</span>
                        </div>
                        <div className="text-3xl font-bold text-[#00FF9F] font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            +${profitAlpha.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-2">
                            Incremental profit the AI captured
                        </div>
                    </div>

                    {/* Success Fee (Our Share) */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🤝</span>
                            <span className="text-xs text-amber-400">SUCCESS FEE ({feeRate}%)</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            ${successFeeAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 mt-2">
                            Our share of the new profits
                        </div>
                    </div>

                    {/* Net Profit (What You Keep) */}
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎯</span>
                            <span className="text-xs text-purple-400">NET PROFIT (YOURS)</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            +${netProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 mt-2">
                            Pure additional profit you keep
                        </div>
                    </div>
                </div>

                {/* Fee Tier Info */}
                <div className="p-4 bg-[#1a1a1a] rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">Current Tier: Professional</span>
                        <span className="text-sm font-bold text-amber-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>{feeRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>5% (Startup)</span>
                        <span className="text-amber-400 font-bold">8% (Pro) ✓</span>
                        <span>15% (Enterprise)</span>
                    </div>
                </div>
            </div>

            {/* Value Proposition */}
            <div className="p-6 bg-gradient-to-r from-[#00FF9F]/10 to-[#121212] border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-[#00FF9F] mb-1">💡 True Profit Alignment</div>
                        <div className="text-xs text-slate-400">
                            We only earn when you earn. $0 profit alpha = $0 fee. No base fees, no minimums.
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-[#00FF9F] font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            {roi > 0 ? `${roi.toFixed(0)}:1` : '∞'}
                        </div>
                        <div className="text-xs text-slate-400">Your ROI</div>
                    </div>
                </div>
            </div>

            {/* Action */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    Invoice generated at end of billing period • Payment via Stripe
                </div>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all">
                    📄 Download Invoice Preview
                </button>
            </div>
        </section>
    );
}
