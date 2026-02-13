'use client';

import { useState, useEffect } from 'react';

interface BrandProfile {
    id: string;
    name: string;
    marketplace: string;
    status: 'connected' | 'disconnected' | 'syncing';
    shadowMode: boolean;
    metrics: {
        alpha: number;
        alphaPercent: number;
        shadowDays: number;
        health: 'excellent' | 'good' | 'warning' | 'critical';
        lastSync: string;
    };
}

// Mock multi-brand data - in production fetched from /amazon/status
const mockBrands: BrandProfile[] = [
    {
        id: 'brand-001',
        name: 'AudioTech Pro',
        marketplace: 'US',
        status: 'connected',
        shadowMode: true,
        metrics: {
            alpha: 1569.03,
            alphaPercent: 47.6,
            shadowDays: 21,
            health: 'excellent',
            lastSync: '2024-12-25T23:45:00Z'
        }
    },
    {
        id: 'brand-002',
        name: 'SoundWave EU',
        marketplace: 'DE',
        status: 'connected',
        shadowMode: true,
        metrics: {
            alpha: 892.45,
            alphaPercent: 32.1,
            shadowDays: 14,
            health: 'good',
            lastSync: '2024-12-25T23:42:00Z'
        }
    },
    {
        id: 'brand-003',
        name: 'BassBoost UK',
        marketplace: 'UK',
        status: 'connected',
        shadowMode: true,
        metrics: {
            alpha: 423.18,
            alphaPercent: 18.4,
            shadowDays: 8,
            health: 'warning',
            lastSync: '2024-12-25T23:30:00Z'
        }
    },
    {
        id: 'brand-004',
        name: 'PremiumAudio JP',
        marketplace: 'JP',
        status: 'syncing',
        shadowMode: false,
        metrics: {
            alpha: 0,
            alphaPercent: 0,
            shadowDays: 0,
            health: 'warning',
            lastSync: '2024-12-25T22:00:00Z'
        }
    },
    {
        id: 'brand-005',
        name: 'EarTech CA',
        marketplace: 'CA',
        status: 'disconnected',
        shadowMode: false,
        metrics: {
            alpha: 0,
            alphaPercent: 0,
            shadowDays: 0,
            health: 'critical',
            lastSync: '2024-12-24T18:00:00Z'
        }
    }
];

const healthColors = {
    excellent: { border: 'border-l-success-500', dot: 'bg-success-500' },
    good: { border: 'border-l-success-400', dot: 'bg-success-400' },
    warning: { border: 'border-l-warning-500', dot: 'bg-warning-500' },
    critical: { border: 'border-l-error-500', dot: 'bg-error-500' }
};

const marketplaceFlags: Record<string, string> = {
    US: '🇺🇸',
    DE: '🇩🇪',
    UK: '🇬🇧',
    JP: '🇯🇵',
    CA: '🇨🇦',
    FR: '🇫🇷',
    IT: '🇮🇹',
    ES: '🇪🇸',
    MX: '🇲🇽',
    AU: '🇦🇺'
};

function BrandCard({ brand }: { brand: BrandProfile }) {
    const colors = healthColors[brand.metrics.health];
    const flag = marketplaceFlags[brand.marketplace] || '🌐';

    const timeSinceSync = () => {
        const diff = Date.now() - new Date(brand.metrics.lastSync).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className={`p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] border-l-[3px] ${colors.border} transition-all hover:scale-[1.02]`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{flag}</span>
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{brand.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">{brand.marketplace}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {brand.shadowMode && (
                        <span className="px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded text-[10px]">SHADOW</span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${colors.dot} ${brand.status === 'syncing' ? 'animate-pulse' : ''}`}></div>
                </div>
            </div>

            {/* Metrics */}
            {brand.status === 'connected' && brand.shadowMode ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Profit Alpha</span>
                        <span className="text-lg font-bold text-success-500 dark:text-success-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            +${brand.metrics.alpha.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Alpha %</span>
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300" style={{ fontFamily: 'JetBrains Mono' }}>
                            {brand.metrics.alphaPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Shadow Days</span>
                        <span className={`text-sm font-mono ${brand.metrics.shadowDays >= 14 ? 'text-success-500 dark:text-success-400' : 'text-warning-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                            {brand.metrics.shadowDays}/14d
                        </span>
                    </div>
                </div>
            ) : (
                <div className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                    {brand.status === 'disconnected' ? 'Reconnection Required' :
                        brand.status === 'syncing' ? 'Initial Sync...' :
                            'Shadow Mode Inactive'}
                </div>
            )}

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700/30 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Synced {timeSinceSync()}</span>
            </div>
        </div>
    );
}

export default function EnterpriseOverview() {
    const [brands, setBrands] = useState<BrandProfile[]>(mockBrands);
    const [loading, setLoading] = useState(false);

    // Aggregate metrics
    const totalAlpha = brands
        .filter(b => b.status === 'connected' && b.shadowMode)
        .reduce((sum, b) => sum + b.metrics.alpha, 0);

    const avgAlphaPercent = (() => {
        const activeBrands = brands.filter(b => b.status === 'connected' && b.shadowMode);
        if (activeBrands.length === 0) return 0;
        return activeBrands.reduce((sum, b) => sum + b.metrics.alphaPercent, 0) / activeBrands.length;
    })();

    const connectedCount = brands.filter(b => b.status === 'connected').length;
    const shadowCount = brands.filter(b => b.shadowMode).length;
    const healthyCount = brands.filter(b => b.metrics.health === 'excellent' || b.metrics.health === 'good').length;

    return (
        <section className="bg-gray-50 dark:bg-gray-950 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏢</span>
                        <div>
                            <h2 className="text-lg font-bold">Enterprise Command Cockpit</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Multi-Brand Portfolio Overview</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }}
                        disabled={loading}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        ) : '↻'} Refresh All
                    </button>
                </div>
            </div>

            {/* Aggregate Summary */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-5 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-success-500 dark:text-success-400 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            +${totalAlpha.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Alpha</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-700 dark:text-gray-200 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                            {avgAlphaPercent.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Alpha %</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{brands.length}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Brands</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-success-500 dark:text-success-400">{connectedCount}/{brands.length}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Connected</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-3xl font-bold ${(brands.length - healthyCount) > 0 ? 'text-warning-500 dark:text-warning-400' : 'text-success-500 dark:text-success-400'}`}>
                            {brands.length - healthyCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Need Attention</div>
                    </div>
                </div>
            </div>

            {/* Brand Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {brands.map(brand => (
                        <BrandCard key={brand.id} brand={brand} />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500">
                Portfolio managed by Cybernetic Command • Next sync in 5 minutes
            </div>
        </section>
    );
}
