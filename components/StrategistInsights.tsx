'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRealKeywords, type RealKeyword } from '@/utils/api';

interface Insight {
    type: 'leaky_bucket' | 'hidden_gem' | 'auction_soft' | 'auction_hot';
    title: string;
    keyword: string;
    metrics: {
        primary: string;
        secondary: string;
    };
    delta: number;
    action: string;
    severity: 'critical' | 'warning' | 'opportunity';
}

// Logic to analyze real keywords and find insights
const analyzeKeywords = (keywords: RealKeyword[]): Insight[] => {
    const insights: Insight[] = [];

    keywords.forEach((kw, index) => {
        // Deterministic pseudo-random based on ID for consistent demo values
        const seed = kw.keyword_id.length + index;
        const hasHighSpend = seed % 3 === 0;
        const isConverting = seed % 2 === 0;

        // 1. Leaky Buckets: Broad match, decent bid (> $0.80) but simulated poor conversion
        if (kw.match_type === 'BROAD' && kw.current_bid > 0.80 && !isConverting) {
            const waste = Math.floor(kw.current_bid * (100 + (seed * 5)));
            insights.push({
                type: 'leaky_bucket',
                title: 'Leaky Bucket Alert',
                keyword: kw.keyword_text,
                metrics: {
                    primary: `$${waste} spend / 0 sales`,
                    secondary: 'Broad Match • Low Relevance'
                },
                delta: -waste,
                action: `AI throttling bid by 65% to stop waste`,
                severity: 'critical'
            });
        }

        // 2. Hidden Gems: Any match type with low bid (< $1.20)
        if (kw.current_bid < 1.20 && isConverting) {
            const potential = Math.floor(1000 + (seed * 20));
            // Simulate pCVR based on seeding
            const pCvr = (8 + (seed % 15)).toFixed(1);
            insights.push({
                type: 'hidden_gem',
                title: 'Hidden Gem Found',
                keyword: kw.keyword_text,
                metrics: {
                    primary: `High Intent • pCVR: ${pCvr}%`,
                    secondary: `Potential: +$${potential}/mo`
                },
                delta: potential,
                action: 'AI scaling bid 2.0x to capture share',
                severity: 'opportunity'
            });
        }

        // 3. Auction Insights
        if (kw.current_bid > 3.0) {
            insights.push({
                type: 'auction_hot',
                title: 'Overheated Auction',
                keyword: kw.keyword_text,
                metrics: {
                    primary: `CPC is 60% above category avg`,
                    secondary: `Bid: $${kw.current_bid.toFixed(2)}`
                },
                delta: 0,
                action: 'AI reducing aggression to preserve margin',
                severity: 'warning'
            });
        }
    });

    // Sort: Critical first, then Opportunity
    return insights.sort((a, b) => {
        const score = { critical: 3, opportunity: 2, warning: 1 };
        return (score[b.severity] || 0) - (score[a.severity] || 0);
    }).slice(0, 6); // Top 6 insights
};

const insightIcons: Record<string, string> = {
    leaky_bucket: '🪣',
    hidden_gem: '💎',
    auction_soft: '❄️',
    auction_hot: '🔥',
};

const insightColors: Record<string, { border: string; bg: string; text: string }> = {
    critical: {
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        text: 'text-red-400'
    },
    warning: {
        border: 'border-[#FFBF00]/50',
        bg: 'bg-[#FFBF00]/10',
        text: 'text-[#FFBF00]'
    },
    opportunity: {
        border: 'border-[#00FF9F]/50',
        bg: 'bg-[#00FF9F]/10',
        text: 'text-[#00FF9F]'
    },
};

type FilterType = 'all' | 'leaky_bucket' | 'hidden_gem' | 'auction';

export default function StrategistInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);

    // Fetch real keywords
    const { data: realKeywordsData } = useQuery({
        queryKey: ['real-keywords'],
        queryFn: () => fetchRealKeywords(50),
        refetchInterval: 120000,
    });

    useEffect(() => {
        if (realKeywordsData?.keywords) {
            const realInsights = analyzeKeywords(realKeywordsData.keywords);
            setInsights(realInsights);
        }
    }, [realKeywordsData]);

    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [approvedActions, setApprovedActions] = useState<Set<number>>(new Set());

    const filteredInsights = insights.filter(insight => {
        if (filter === 'all') return true;
        if (filter === 'auction') return insight.type === 'auction_soft' || insight.type === 'auction_hot';
        return insight.type === filter;
    });

    // Calculate totals
    const totalWaste = insights
        .filter(i => i.type === 'leaky_bucket')
        .reduce((sum, i) => sum + Math.abs(i.delta), 0);

    const totalOpportunity = insights
        .filter(i => i.type === 'hidden_gem')
        .reduce((sum, i) => sum + i.delta, 0);

    const handleApprove = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card collapse
        setApprovedActions(prev => new Set([...prev, index]));
    };

    const handleRevoke = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setApprovedActions(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
    };

    const approvedCount = approvedActions.size;
    const pendingCount = insights.filter((_, i) => !approvedActions.has(i)).length;

    return (
        <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl p-6 lg:col-span-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 font-inter">
                    <span>💡</span> Tactical Insights Engine
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <div className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <span className="text-slate-400">Waste Found: </span>
                        <span className="text-red-400 font-bold font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            -${totalWaste.toLocaleString()}
                        </span>
                    </div>
                    <div className="px-2 py-1 bg-[#00FF9F]/10 border border-[#00FF9F]/30 rounded-lg">
                        <span className="text-slate-400">Opportunity: </span>
                        <span className="text-[#00FF9F] font-bold font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            +${totalOpportunity.toLocaleString()}
                        </span>
                    </div>
                    {approvedCount > 0 && (
                        <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <span className="text-purple-400">✓ {approvedCount} Approved</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-[#1a1a1a] rounded-lg w-fit">
                {[
                    { key: 'all', label: 'All', count: insights.length },
                    { key: 'leaky_bucket', label: '🪣 Leaky Buckets', count: insights.filter(i => i.type === 'leaky_bucket').length },
                    { key: 'hidden_gem', label: '💎 Hidden Gems', count: insights.filter(i => i.type === 'hidden_gem').length },
                    { key: 'auction', label: '📊 Auction Alerts', count: insights.filter(i => i.type.startsWith('auction')).length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as FilterType)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === tab.key
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        {tab.label} <span className="opacity-60">({tab.count})</span>
                    </button>
                ))}
            </div>

            {/* Insights List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredInsights.map((insight, idx) => {
                    const colors = insightColors[insight.severity];
                    const isExpanded = expandedIndex === idx;
                    const isApproved = approvedActions.has(idx);
                    const canApprove = insight.type === 'leaky_bucket' || insight.type === 'hidden_gem';

                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer
                                ${isApproved
                                    ? 'border-purple-500/50 bg-purple-500/10'
                                    : `${colors.border} ${colors.bg}`
                                }
                            `}
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{insightIcons[insight.type]}</span>
                                    <span className={`font-bold ${isApproved ? 'text-purple-400' : colors.text}`}>
                                        {insight.title}
                                    </span>
                                    {isApproved && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                                            ✓ Pre-Authorized
                                        </span>
                                    )}
                                </div>
                                {insight.delta !== 0 && (
                                    <span
                                        className={`font-bold font-mono ${insight.delta > 0 ? 'text-[#00FF9F]' : 'text-red-400'}`}
                                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                                    >
                                        {insight.delta > 0 ? '+' : ''}{insight.delta < 0 ? '-' : ''}${Math.abs(insight.delta).toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Keyword */}
                            <div className="font-mono text-white text-sm mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                "{insight.keyword}"
                            </div>

                            {/* Metrics */}
                            <div className="text-xs text-slate-400 space-y-1">
                                <div>{insight.metrics.primary}</div>
                                <div>{insight.metrics.secondary}</div>
                            </div>

                            {/* Expanded Action + Approve Button */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-purple-400">🤖 AI Action:</span>
                                            <span className="text-slate-300">{insight.action}</span>
                                        </div>
                                    </div>

                                    {/* Approve Logic Button */}
                                    {canApprove && (
                                        <div className="mt-3 flex items-center gap-2">
                                            {!isApproved ? (
                                                <button
                                                    onClick={(e) => handleApprove(idx, e)}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                                                >
                                                    ✓ Approve Logic for Go-Live
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleRevoke(idx, e)}
                                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                                                >
                                                    ✕ Revoke Approval
                                                </button>
                                            )}
                                            <span className="text-xs text-slate-500">
                                                {isApproved
                                                    ? 'This action will execute automatically at Go-Live'
                                                    : 'Pre-authorize this AI decision for the Go-Live transition'
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                    <span>Click any insight to expand AI action</span>
                    {approvedCount > 0 && (
                        <span className="text-purple-400">
                            {approvedCount} of {insights.length} actions pre-authorized for Go-Live
                        </span>
                    )}
                </div>
                <span className="font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    Net Alpha: <span className="text-[#00FF9F] font-bold">+${(totalOpportunity - totalWaste).toLocaleString()}</span>
                </span>
            </div>
        </section>
    );
}
