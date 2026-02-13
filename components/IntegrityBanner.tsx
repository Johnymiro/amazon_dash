'use client';

import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/utils/api';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

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

export function useSystemIntegrity() {
    return useQuery({
        queryKey: ['system-handshake'],
        queryFn: async (): Promise<HandshakeResponse> => {
            const res = await fetch(`${API_BASE}/system/handshake`, { credentials: 'include' });
            if (!res.ok) throw new Error('Handshake failed');
            return res.json();
        },
        refetchInterval: 60000,
        retry: 3,
    });
}

export default function IntegrityBanner() {
    const { data, isLoading, error } = useSystemIntegrity();

    if (isLoading) {
        return (
            <span className="text-theme-xs text-gray-400 dark:text-gray-500 animate-pulse">Verifying...</span>
        );
    }

    const isCompromised = error || !data || data.math_sovereignty !== 'backend' || !data.frontend_readonly;

    if (isCompromised) {
        return (
            <span className="flex items-center gap-1.5 text-theme-xs text-warning-400 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Integrity Warning
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 text-theme-xs text-success-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
        </span>
    );
}
