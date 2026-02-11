"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Server, AlertTriangle, ArrowRight, Loader2, Zap, TrendingUp, Shield, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardGatekeeperProps {
    children: React.ReactNode;
}

interface UserStatus {
    connected: boolean;
    ads_connected: boolean;
    sp_api_connected: boolean;
    profile_id?: string;
    region?: string;
}

type GatekeeperState = 'loading' | 'no_ads' | 'partial' | 'full';

export default function DashboardGatekeeper({ children }: DashboardGatekeeperProps) {
    const { user } = useAuth();
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSpApiModal, setShowSpApiModal] = useState(false);
    const [dismissedWarning, setDismissedWarning] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const handleConnect = async (type: 'ads' | 'sp') => {
        try {
            const tenantId = user?.tenant_id || 'default';
            const params = new URLSearchParams({
                tenant_id: tenantId,
                grants: 'ads',
                region: 'eu',
                success_redirect: `${window.location.origin}/`,
                error_redirect: `${window.location.origin}/?error=oauth_failed`
            });

            window.location.href = `${API_BASE_URL}/oauth/unified/authorize?${params.toString()}`;
        } catch (err: any) {
            console.error("Connect error", err);
            setError(err.message);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/amazon/status`, {
                credentials: 'include'
            });

            if (!res.ok) {
                if (res.status === 401) {
                    setLoading(false);
                    return;
                }
                throw new Error('Failed to fetch status');
            }
            const data = await res.json();
            setStatus(data);
        } catch (err: any) {
            // If backend is unreachable, skip gatekeeper and show dashboard
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const getState = (): GatekeeperState => {
        if (loading) return 'loading';
        if (!status || !status.ads_connected) return 'no_ads';
        return 'full';
    };

    const currentState = getState();

    // ==================== LOADING STATE ====================
    if (currentState === 'loading') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-success-500/10">
                        <Loader2 className="h-8 w-8 animate-spin text-success-400" />
                    </div>
                    <span className="font-medium text-success-400 text-sm">INITIALIZING GATEKEEPER...</span>
                </div>
            </div>
        );
    }

    if (!status) {
        return <>{children}</>;
    }

    // ==================== STATE 1: NO ADS CONNECTED ====================
    if (currentState === 'no_ads') {
        return (
            <div className="fixed inset-0 z-99999 flex items-center justify-center bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-2xl border border-success-500/20 bg-gray-50 dark:bg-gray-950 p-8 shadow-theme-xl animate-fade-in">
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/10 ring-1 ring-success-500/20">
                            <ShieldCheck className="h-7 w-7 text-success-400" />
                        </div>
                        <div>
                            <p className="text-theme-xs font-semibold text-success-400 uppercase tracking-wider">REQUIRED</p>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Amazon Ads</h2>
                        </div>
                    </div>

                    {/* Agent Info */}
                    <div className="mb-6 rounded-xl border border-success-500/15 bg-success-500/5 p-4">
                        <h3 className="mb-2 font-semibold text-success-400 text-sm">Required for: The Tactician Agent</h3>
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            The Tactician needs access to your Amazon Advertising data to calculate the
                            <span className="mx-1 font-mono text-success-400">Intraday Performance Delta</span>
                            and optimize your bids in real-time.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="mb-6 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                            <Zap className="h-4 w-4 text-success-400 flex-shrink-0" />
                            <span>Real-time bid optimization</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                            <TrendingUp className="h-4 w-4 text-success-400 flex-shrink-0" />
                            <span>Marketing Stream data ingestion</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                            <Shield className="h-4 w-4 text-success-400 flex-shrink-0" />
                            <span>Campaign performance tracking</span>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => handleConnect('ads')}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-success-500 px-6 py-4 font-semibold text-white shadow-theme-sm transition-all hover:bg-success-400 text-sm"
                    >
                        Connect Amazon Ads
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        );
    }

    // ==================== STATE 2: PARTIAL ====================
    if (currentState === 'partial') {
        return (
            <>
                {!dismissedWarning && (
                    <div className="fixed left-0 right-0 top-0 z-9999 border-b border-warning-500/20 bg-warning-500/5 backdrop-blur-sm px-4 py-3">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning-400" />
                                <div>
                                    <p className="font-semibold text-warning-400 text-sm">
                                        Inventory Protection Disabled
                                    </p>
                                    <p className="text-theme-xs text-warning-300/70">
                                        Connect SP-API to enable the Supply Sentinel and prevent Stockout Death Spiral.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSpApiModal(true)}
                                    className="rounded-lg bg-warning-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-warning-400 shadow-theme-xs"
                                >
                                    Connect Now
                                </button>
                                <button
                                    onClick={() => setDismissedWarning(true)}
                                    className="rounded-lg p-2 text-warning-400 transition-colors hover:bg-warning-500/10"
                                    title="Dismiss"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SP-API Connection Modal */}
                {showSpApiModal && (
                    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl border border-warning-500/20 bg-gray-50 dark:bg-gray-950 p-8 shadow-theme-xl animate-fade-in">
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-500/10 ring-1 ring-warning-500/20">
                                        <Server className="h-7 w-7 text-warning-400" />
                                    </div>
                                    <div>
                                        <p className="text-theme-xs font-semibold text-warning-400 uppercase tracking-wider">STEP 2 OF 2</p>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Inventory Data</h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSpApiModal(false)}
                                    className="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Agent Info */}
                            <div className="mb-6 rounded-xl border border-warning-500/15 bg-warning-500/5 p-4">
                                <h3 className="mb-2 font-semibold text-warning-400 text-sm">Required for: The Supply Sentinel</h3>
                                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    The Supply Sentinel needs access to your Seller Central inventory to calculate
                                    <span className="mx-1 font-mono text-warning-400">Days of Supply (DoS)</span>
                                    and
                                    <span className="mx-1 font-mono text-warning-400">Effective Lead Time (L<sub>eff</sub>)</span>.
                                </p>
                            </div>

                            {/* Warning */}
                            <div className="mb-6 rounded-xl border border-error-500/15 bg-error-500/5 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error-400" />
                                    <div>
                                        <p className="font-medium text-error-400 text-sm">Without SP-API:</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            The braking multiplier (M<sub>supply</sub>) cannot be calculated.
                                            The system will operate without inventory protection, risking stockouts.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="mb-6 space-y-2.5">
                                <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                                    <Shield className="h-4 w-4 text-warning-400 flex-shrink-0" />
                                    <span>Stockout Death Spiral prevention</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                                    <TrendingUp className="h-4 w-4 text-warning-400 flex-shrink-0" />
                                    <span>Inventory-aware bid dampening</span>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleConnect('sp')}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-warning-500 px-6 py-4 font-semibold text-white shadow-theme-sm transition-all hover:bg-warning-400 text-sm"
                                >
                                    Authorize Seller Central
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </button>
                                <button
                                    onClick={() => setShowSpApiModal(false)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Skip for now (not recommended)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={!dismissedWarning ? 'pt-[72px]' : ''}>
                    {children}
                </div>
            </>
        );
    }

    // ==================== STATE 3: FULL ====================
    return <>{children}</>;
}
