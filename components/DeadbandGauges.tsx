'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRealKeywords, type RealKeyword } from '@/utils/api';

interface DeadbandProduct {
    name: string;
    dos: number;
    leff: number;
    state: 'launch' | 'profit' | 'defense' | 'rationing' | 'liquidation';
    acos: number;
    sov: number;
    noiseData: number[];
}

const SHADOW_BLUE = '#778BA5';

// Generate random noise data simulating market fluctuations
const generateNoiseData = (baseValue: number, volatility: number, length: number): number[] => {
    const data: number[] = [];
    let current = baseValue;
    for (let i = 0; i < length; i++) {
        current += (Math.random() - 0.5) * volatility;
        current = Math.max(0, Math.min(100, current));
        data.push(current);
    }
    return data;
};

// Map real keywords to deadband products with deterministic random metrics
const mapKeywordsToProducts = (keywords: RealKeyword[]): DeadbandProduct[] => {
    return keywords.slice(0, 3).map((kw, index) => {
        const seed = kw.keyword_id.length + index;

        // Deterministic metrics based on keyword hash
        const dos = 10 + (seed % 45);
        const acos = 15 + (seed % 35);
        const sov = 5 + (seed % 25);

        const states: DeadbandProduct['state'][] = ['profit', 'defense', 'rationing', 'launch'];
        const state = states[seed % states.length];

        return {
            name: kw.keyword_text, // Use real keyword text instead of ASIN
            dos,
            leff: 14, // Fixed reference
            state,
            acos,
            sov,
            noiseData: generateNoiseData(acos, 8, 30)
        };
    });
};

const stateColors: Record<string, { gradient: string; text: string }> = {
    launch: { gradient: 'bg-gradient-to-r from-blue-500 to-blue-600', text: 'text-blue-light-400' },
    profit: { gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600', text: 'text-success-400' },
    defense: { gradient: 'bg-gradient-to-r from-orange-500 to-orange-600', text: 'text-orange-400' },
    rationing: { gradient: 'bg-gradient-to-r from-amber-500 to-amber-600', text: 'text-warning-400' },
    liquidation: { gradient: 'bg-gradient-to-r from-red-500 to-red-600', text: 'text-error-400' },
};

// Sparkline component for market noise visualization
function Sparkline({ data, threshold, color }: { data: number[]; threshold: number; color: string }) {
    const width = 120;
    const height = 24;
    const max = Math.max(...data) * 1.1;
    const min = Math.min(...data) * 0.9;

    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    const thresholdY = height - ((threshold - min) / (max - min)) * height;

    return (
        <svg width={width} height={height} className="overflow-visible">
            {/* Threshold line */}
            <line
                x1={0}
                y1={thresholdY}
                x2={width}
                y2={thresholdY}
                stroke="#FFBF00"
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.5}
            />
            {/* Sparkline */}
            <polyline
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                points={points}
            />
            {/* Current value dot */}
            <circle
                cx={width}
                cy={height - ((data[data.length - 1] - min) / (max - min)) * height}
                r={3}
                fill={color}
            />
        </svg>
    );
}

function AntiChatterAnimation({ product }: { product: DeadbandProduct }) {
    const [noiseIndex, setNoiseIndex] = useState(0);
    const [spikeDetected, setSpikeDetected] = useState(false);
    const [ignored, setIgnored] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setNoiseIndex(prev => {
                const next = (prev + 1) % product.noiseData.length;

                // Detect spike (value crosses threshold)
                const current = product.noiseData[next];
                const threshold = product.state === 'profit' ? 30 : 50;
                if (current > threshold && product.state === 'profit') {
                    setSpikeDetected(true);
                    setIgnored(prev => prev + 1);
                    setTimeout(() => setSpikeDetected(false), 500);
                }

                return next;
            });
        }, 200);

        return () => clearInterval(interval);
    }, [product]);

    const currentValue = product.noiseData[noiseIndex];
    const threshold = product.state === 'profit' ? 30 : 50;
    const isWithinDeadband = Math.abs(currentValue - threshold) < 10;

    return (
        <div className="flex items-center gap-3">
            {/* Sparkline */}
            <div className="relative">
                <Sparkline
                    data={product.noiseData.slice(0, noiseIndex + 1).concat(product.noiseData.slice(noiseIndex + 1))}
                    threshold={threshold}
                    color={stateColors[product.state].text.replace('text-', '#').replace('-400', '')}
                />
                {spikeDetected && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-warning-500/50 rounded-full animate-ping" />
                )}
            </div>

            {/* Deadband indicator */}
            <div className={`
                px-2 py-1 rounded text-xs font-mono transition-all
                ${isWithinDeadband ? 'bg-warning-500/10 text-warning-400 border border-warning-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}
            `} style={{ fontFamily: 'JetBrains Mono' }}>
                {isWithinDeadband ? '⚡ IN DEADBAND' : 'STABLE'}
            </div>

            {/* Ignored counter */}
            {ignored > 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                    🛡️ <span className="text-success-400">{ignored}</span> ignored
                </div>
            )}
        </div>
    );
}

export default function DeadbandGauges() {
    const [showStressTest, setShowStressTest] = useState(false);

    // Fetch real keywords
    const { data: realKeywordsData } = useQuery({
        queryKey: ['real-keywords'],
        queryFn: () => fetchRealKeywords(50),
        refetchInterval: 60000,
    });

    const products = useMemo(() => {
        if (realKeywordsData?.keywords && realKeywordsData.keywords.length > 0) {
            return mapKeywordsToProducts(realKeywordsData.keywords);
        }
        return [];
    }, [realKeywordsData]);

    if (products.length === 0) return null; // Or loading state

    return (
        <section className="bg-gray-50 dark:bg-gray-950 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span>⚖️</span> Hysteresis Buffer (Anti-Chatter)
                    </h3>
                    <div className="relative group">
                        <span className="text-gray-400 dark:text-gray-500 cursor-help">ⓘ</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <div className="font-bold text-gray-900 dark:text-white mb-1">Deadband Protection</div>
                            <p>The Strategist uses hysteresis to prevent "chatter" — rapid state oscillations caused by temporary market noise. It ignores small fluctuations within the deadband threshold.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowStressTest(!showStressTest)}
                    className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${showStressTest
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }
                    `}
                >
                    {showStressTest ? '📊 Hide Noise' : '📊 Show Market Noise'}
                </button>
            </div>

            {/* Products */}
            <div className="space-y-4">
                {products.map((p) => {
                    const position = Math.min(100, Math.max(0, (p.dos / 60) * 100));
                    const bufferPos = (p.leff / 60) * 100;

                    return (
                        <div key={p.name} className="p-4 bg-white dark:bg-gray-900 rounded-xl">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm" style={{ fontFamily: 'JetBrains Mono' }}>{p.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${stateColors[p.state].gradient}`}>
                                        {p.state.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div>
                                        <span className="text-gray-400 dark:text-gray-500">ACoS:</span>
                                        <span className={`ml-1 font-mono ${p.acos < 30 ? 'text-success-400' : 'text-warning-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                                            {p.acos}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 dark:text-gray-500">SOV:</span>
                                        <span className="ml-1 font-mono text-brand-400" style={{ fontFamily: 'JetBrains Mono' }}>{p.sov}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gauge */}
                            <div className="relative h-8 mb-2">
                                {/* Gradient gauge */}
                                <div
                                    className="absolute inset-0 rounded-lg overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(to right, #EF4444 0%, #F59E0B 25%, #F97316 40%, #10B981 60%, #3B82F6 100%)'
                                    }}
                                />

                                {/* Deadband zone */}
                                <div
                                    className="absolute top-0 bottom-0 bg-white/10 border-l border-r border-white/30"
                                    style={{
                                        left: `${bufferPos - 5}%`,
                                        width: '10%'
                                    }}
                                />

                                {/* L_eff marker */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-white/70"
                                    style={{ left: `${bufferPos}%` }}
                                >
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                                        L<sub>eff</sub>
                                    </div>
                                </div>

                                {/* Current position */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-white dark:border-gray-900 shadow-lg transition-all duration-300"
                                    style={{ left: `calc(${position}% - 10px)` }}
                                />
                            </div>

                            {/* Scale */}
                            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                                <span>0d</span>
                                <span className={stateColors[p.state].text}>DoS: {p.dos}d</span>
                                <span>60d</span>
                            </div>

                            {/* Anti-Chatter Animation (stress test mode) */}
                            {showStressTest && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-400 dark:text-gray-500">Market Noise (ACoS)</div>
                                        <AntiChatterAnimation product={p} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-white/10 border border-white/30 rounded"></div>
                        <span>Deadband Zone</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-warning-500"></div>
                        <span>Threshold</span>
                    </div>
                </div>
                <div className="font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                    Hysteresis = ±5d buffer
                </div>
            </div>
        </section>
    );
}
