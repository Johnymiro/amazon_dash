'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/utils/api';
import { ShieldCheck } from 'lucide-react';

interface VerifiedSourceBadgeProps {
    source?: 'amazon' | 'shadow' | 'api';
    className?: string;
}

interface AmazonStatus {
    connected: boolean;
    last_sync?: string;
    account_name?: string;
    marketplace?: string;
}

export default function VerifiedSourceBadge({ source = 'amazon', className = '' }: VerifiedSourceBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [status, setStatus] = useState<AmazonStatus | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/amazon/status`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch {
                // API not available
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = status?.connected || source === 'shadow';

    const formatTimestamp = (timestamp?: string) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div
            className={`relative inline-flex ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Badge */}
            <div
                className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md text-theme-xs font-medium
                    transition-all duration-200 cursor-pointer border
                    ${isActive
                        ? 'bg-success-500/5 border-success-500/20 text-success-400'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }
                `}
            >
                <ShieldCheck className={`w-3 h-3 ${isActive ? 'text-success-400' : 'text-gray-500'}`} />
                <span>Verified Source</span>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-99999 w-64">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-theme-xl p-3">
                        {/* Arrow */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-950 border-l border-t border-gray-200 dark:border-gray-800 rotate-45"></div>

                        {/* Content */}
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-success-400 animate-pulse' : 'bg-gray-500'}`}></span>
                                <span className={`text-sm font-semibold ${isActive ? 'text-success-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {isActive ? 'API Connected' : 'Disconnected'}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-theme-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-400 dark:text-gray-500">Last Sync:</span>
                                    <span className="text-gray-900 dark:text-white font-mono">{formatTimestamp(status?.last_sync)}</span>
                                </div>
                                {status?.account_name && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 dark:text-gray-500">Account:</span>
                                        <span className="text-gray-900 dark:text-white">{status.account_name}</span>
                                    </div>
                                )}
                                {status?.marketplace && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 dark:text-gray-500">Marketplace:</span>
                                        <span className="text-gray-900 dark:text-white">{status.marketplace}</span>
                                    </div>
                                )}
                            </div>

                            {!isActive && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                    <p className="text-theme-xs text-warning-400">
                                        Using shadow simulation data
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
