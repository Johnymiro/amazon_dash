'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/utils/api';

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
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
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
          flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
          transition-all duration-200 cursor-pointer
          ${isActive
                        ? 'bg-[#121212] border border-[#00FF9F]/30 text-[#00FF9F]'
                        : 'bg-[#121212] border border-slate-600/30 text-slate-400'
                    }
        `}
            >
                <svg
                    className={`w-3 h-3 ${isActive ? 'text-[#00FF9F]' : 'text-slate-500'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
                <span>Verified Source</span>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl p-3">
                        {/* Arrow */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-l border-t border-[#2a2a2a] rotate-45"></div>

                        {/* Content */}
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00FF9F] animate-pulse' : 'bg-slate-500'}`}></span>
                                <span className={`text-sm font-semibold ${isActive ? 'text-[#00FF9F]' : 'text-slate-400'}`}>
                                    {isActive ? 'API Connected' : 'Disconnected'}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Last Sync:</span>
                                    <span className="text-white font-mono">{formatTimestamp(status?.last_sync)}</span>
                                </div>
                                {status?.account_name && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Account:</span>
                                        <span className="text-white">{status.account_name}</span>
                                    </div>
                                )}
                                {status?.marketplace && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Marketplace:</span>
                                        <span className="text-white">{status.marketplace}</span>
                                    </div>
                                )}
                            </div>

                            {!isActive && (
                                <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                                    <p className="text-xs text-amber-400">
                                        ⚠️ Using shadow simulation data
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
