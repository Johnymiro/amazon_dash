'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/utils/api';

// ═══════════════════════════════════════════════════════════════
// INTEGRITY BANNER COMPONENT
// Validates API-First architecture by calling /system/handshake
// ═══════════════════════════════════════════════════════════════

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

    // Call /system/handshake endpoint
    const { data, isLoading, error } = useQuery({
        queryKey: ['system-handshake'],
        queryFn: async (): Promise<HandshakeResponse> => {
            const res = await fetch(`${API_BASE}/system/handshake`, { credentials: 'include' });
            if (!res.ok) throw new Error('Handshake failed');
            return res.json();
        },
        refetchInterval: 60000, // Re-verify every 60s
        retry: 3,
    });

    // Don't render if dismissed
    if (dismissed) return null;

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 text-center animate-pulse">
                <span className="text-sm text-slate-400">🔍 Verifying system integrity...</span>
            </div>
        );
    }

    // Error / Failure state
    if (error || !data || data.math_sovereignty !== 'backend' || !data.frontend_readonly) {
        return (
            <div className="bg-amber-900/50 border-b border-amber-500/50 px-4 py-3">
                <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <span className="text-amber-400 font-bold text-sm">
                                Warning: Math Sovereignty Compromised
                            </span>
                            <span className="text-amber-300/80 text-xs ml-2">
                                Frontend calculation detected or backend unreachable
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-amber-400 hover:text-amber-300 text-lg px-2"
                    >
                        ×
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    return (
        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border-b border-emerald-500/30 px-4 py-3">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                        <span className="text-[#00FF9F] font-bold text-sm">
                            System Integrity Verified
                        </span>
                        <span className="text-emerald-400/80 text-xs ml-2 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            UI is pulling 100% Read-Only data from Sovereign Backend
                        </span>
                    </div>

                    {/* Session Status Pills */}
                    <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${data.session_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                            }`}>
                            Session: {data.session_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-mono">
                            {data.bids_logged} bids
                        </span>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                            v{data.version}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setDismissed(true)}
                    className="text-emerald-400 hover:text-emerald-300 text-lg px-2"
                    title="Dismiss"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
