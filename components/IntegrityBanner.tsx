'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/utils/api';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';

interface HandshakeResponse {
    status: string;
    math_sovereignty: string;
    frontend_readonly: boolean;
    api_first: boolean;
    calculations: {
        tnp_formula: string;
        profit_alpha_formula: string;
        success_fee_formula: string;
    };
    session_active: boolean;
    bids_logged: number;
    timestamp: string;
    version: string;
}

export default function IntegrityBanner() {
    const [dismissed, setDismissed] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['system-handshake'],
        queryFn: async (): Promise<HandshakeResponse> => {
            const res = await fetch(`${API_BASE}/system/handshake`, { credentials: 'include' });
            if (!res.ok) throw new Error('Handshake failed');
            return res.json();
        },
        refetchInterval: 60000,
        retry: 3,
    });

    if (dismissed) return null;

    if (isLoading) {
        return (
            <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 text-center bg-gray-100/50 dark:bg-gray-900/50">
                <span className="text-theme-xs text-gray-500 dark:text-gray-400 animate-pulse">Verifying system integrity...</span>
            </div>
        );
    }

    if (error || !data || data.math_sovereignty !== 'backend' || !data.frontend_readonly) {
        return (
            <div className="border-b border-warning-500/30 bg-warning-500/5 px-4 py-3">
                <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-warning-400 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-warning-400 font-semibold text-sm">
                                Warning: Math Sovereignty Compromised
                            </span>
                            <span className="text-warning-300/70 text-theme-xs">
                                Frontend calculation detected or backend unreachable
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-warning-400 hover:text-warning-300 p-1 rounded-lg hover:bg-warning-500/10 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="border-b border-success-500/20 bg-success-500/5 px-4 py-3">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-success-400 flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-success-400 font-semibold text-sm">
                            System Integrity Verified
                        </span>
                        <span className="text-success-400/60 text-theme-xs font-mono">
                            UI is pulling 100% Read-Only data from Sovereign Backend
                        </span>
                    </div>

                    {/* Session Status Pills */}
                    <div className="flex items-center gap-2 ml-2 hidden sm:flex">
                        <span className={`px-2 py-0.5 rounded-md text-theme-xs font-medium ${data.session_active
                            ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                            }`}>
                            Session: {data.session_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-md text-theme-xs font-medium border border-brand-500/20">
                            {data.bids_logged} bids
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-theme-xs border border-gray-300 dark:border-gray-700">
                            v{data.version}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setDismissed(true)}
                    className="text-success-400 hover:text-success-300 p-1 rounded-lg hover:bg-success-500/10 transition-colors"
                    title="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
