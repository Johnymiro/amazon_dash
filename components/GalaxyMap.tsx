'use client';

import { useState, useEffect, useRef } from 'react';

interface IntentCluster {
    id: string;
    label: string;
    classification: 'high_intent' | 'mid_intent' | 'low_intent' | 'negated';
    keywords: number;
    spend: number;
    conversions: number;
    wasteAvoided?: number;
    x: number;
    y: number;
    size: number;
}

const SHADOW_BLUE = '#778BA5';

// Mock semantic clusters - in production these would come from /agents/semantic/classify
const mockClusters: IntentCluster[] = [
    { id: 'C1', label: 'Purchase Intent', classification: 'high_intent', keywords: 34, spend: 2450, conversions: 127, x: 200, y: 150, size: 45 },
    { id: 'C2', label: 'Research Phase', classification: 'mid_intent', keywords: 56, spend: 1820, conversions: 42, x: 350, y: 200, size: 38 },
    { id: 'C3', label: 'Brand Awareness', classification: 'mid_intent', keywords: 28, spend: 980, conversions: 18, x: 150, y: 280, size: 30 },
    { id: 'C4', label: 'Competitor Terms', classification: 'low_intent', keywords: 41, spend: 1540, conversions: 8, x: 400, y: 120, size: 35 },
    { id: 'C5', label: 'Information Only', classification: 'negated', keywords: 23, spend: 0, conversions: 0, wasteAvoided: 847, x: 300, y: 320, size: 28 },
    { id: 'C6', label: 'Off-Topic Queries', classification: 'negated', keywords: 15, spend: 0, conversions: 0, wasteAvoided: 412, x: 450, y: 280, size: 22 },
    { id: 'C7', label: 'Broad Match Bleed', classification: 'negated', keywords: 31, spend: 0, conversions: 0, wasteAvoided: 623, x: 100, y: 180, size: 32 },
];

const classificationColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    high_intent: { bg: 'rgba(0, 255, 159, 0.2)', border: '#00FF9F', text: '#00FF9F', glow: 'rgba(0, 255, 159, 0.4)' },
    mid_intent: { bg: 'rgba(139, 92, 246, 0.2)', border: '#8B5CF6', text: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)' },
    low_intent: { bg: 'rgba(255, 191, 0, 0.2)', border: '#FFBF00', text: '#FFBF00', glow: 'rgba(255, 191, 0, 0.4)' },
    negated: { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)' },
};

function ClusterNode({ cluster, onHover, isHovered }: {
    cluster: IntentCluster;
    onHover: (cluster: IntentCluster | null) => void;
    isHovered: boolean;
}) {
    const colors = classificationColors[cluster.classification];

    return (
        <g
            onMouseEnter={() => onHover(cluster)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
        >
            {/* Glow effect */}
            {isHovered && (
                <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={cluster.size + 10}
                    fill={colors.glow}
                    className="animate-pulse"
                />
            )}

            {/* Main circle */}
            <circle
                cx={cluster.x}
                cy={cluster.y}
                r={cluster.size}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth={isHovered ? 3 : 2}
                style={{ transition: 'all 0.2s' }}
            />

            {/* Label */}
            <text
                x={cluster.x}
                y={cluster.y + 4}
                textAnchor="middle"
                fill={colors.text}
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
            >
                {cluster.keywords}
            </text>
        </g>
    );
}

function ConnectionLine({ from, to }: { from: IntentCluster; to: IntentCluster }) {
    return (
        <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#2a2a2a"
            strokeWidth={1}
            strokeDasharray="4,4"
        />
    );
}

export default function GalaxyMap() {
    const [clusters, setClusters] = useState<IntentCluster[]>(mockClusters);
    const [hoveredCluster, setHoveredCluster] = useState<IntentCluster | null>(null);
    const [loading, setLoading] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Animate clusters slightly for visual interest
    useEffect(() => {
        const interval = setInterval(() => {
            setClusters(prev => prev.map(c => ({
                ...c,
                x: c.x + (Math.random() - 0.5) * 2,
                y: c.y + (Math.random() - 0.5) * 2
            })));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Calculate totals
    const totalWasteAvoided = clusters
        .filter(c => c.classification === 'negated')
        .reduce((sum, c) => sum + (c.wasteAvoided || 0), 0);

    const highIntentKeywords = clusters
        .filter(c => c.classification === 'high_intent')
        .reduce((sum, c) => sum + c.keywords, 0);

    return (
        <section className="bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 font-inter">
                        <span>🌌</span> Semantic Galaxy
                    </h3>
                    <span className="text-xs text-slate-500 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                        /agents/semantic/classify
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs">
                        <span className="text-slate-400">High Intent:</span>
                        <span className="text-emerald-400 ml-1 font-bold">{highIntentKeywords}</span>
                    </div>
                    <div className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs">
                        <span className="text-slate-400">Waste Avoided:</span>
                        <span className="text-red-400 ml-1 font-bold">${totalWasteAvoided.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Galaxy Visualization */}
            <div className="relative bg-[#0a0a0a] rounded-xl overflow-hidden" style={{ height: '380px' }}>
                {/* Radial gradient background */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
                    }}
                />

                {/* SVG Galaxy */}
                <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 550 380">
                    {/* Connection lines (lower z-index) */}
                    {clusters.slice(0, -1).map((c, i) => (
                        <ConnectionLine key={`line-${i}`} from={c} to={clusters[i + 1]} />
                    ))}

                    {/* Cluster nodes */}
                    {clusters.map(cluster => (
                        <ClusterNode
                            key={cluster.id}
                            cluster={cluster}
                            onHover={setHoveredCluster}
                            isHovered={hoveredCluster?.id === cluster.id}
                        />
                    ))}
                </svg>

                {/* Hover Tooltip */}
                {hoveredCluster && (
                    <div
                        className="absolute p-4 bg-[#1a1a1a] border rounded-xl shadow-2xl z-50 w-64"
                        style={{
                            left: Math.min(hoveredCluster.x + 60, 280),
                            top: Math.min(hoveredCluster.y - 40, 280),
                            borderColor: classificationColors[hoveredCluster.classification].border
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span
                                className="font-bold"
                                style={{ color: classificationColors[hoveredCluster.classification].text }}
                            >
                                {hoveredCluster.label}
                            </span>
                            <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{
                                    backgroundColor: classificationColors[hoveredCluster.classification].bg,
                                    color: classificationColors[hoveredCluster.classification].text
                                }}
                            >
                                {hoveredCluster.classification.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Keywords:</span>
                                <span className="font-mono" style={{ fontFamily: 'JetBrains Mono' }}>{hoveredCluster.keywords}</span>
                            </div>

                            {hoveredCluster.classification !== 'negated' ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Spend:</span>
                                        <span className="font-mono" style={{ fontFamily: 'JetBrains Mono' }}>${hoveredCluster.spend.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Conversions:</span>
                                        <span className="font-mono text-emerald-400" style={{ fontFamily: 'JetBrains Mono' }}>{hoveredCluster.conversions}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                                    <div className="text-red-400 font-bold flex items-center gap-1">
                                        💰 Waste Avoided
                                    </div>
                                    <div className="text-lg font-bold text-red-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                                        ${hoveredCluster.wasteAvoided?.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-red-400/70 mt-1">
                                        via Binomial Negation (P &gt; 0.95)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Center label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-xs text-purple-400/50 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>INTENT SPACE</div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                    {Object.entries(classificationColors).map(([key, colors]) => (
                        <div key={key} className="flex items-center gap-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                            />
                            <span className="text-slate-400">{key.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
                <div className="text-xs text-slate-500 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                    Circle size = keyword count
                </div>
            </div>
        </section>
    );
}
