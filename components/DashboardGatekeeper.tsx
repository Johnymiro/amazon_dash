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
            // Use unified OAuth endpoint
            const tenantId = user?.tenant_id || 'default';
            const params = new URLSearchParams({
                tenant_id: tenantId,
                grants: 'ads,sp',  // Request both
                region: 'eu', // Default to EU or valid region
                success_redirect: `${window.location.origin}/`,
                error_redirect: `${window.location.origin}/?error=oauth_failed`
            });

            // Redirect to unified OAuth flow
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
                // If 401, user not authenticated - let ProtectedRoute handle redirect
                if (res.status === 401) {
                    setLoading(false);
                    return;
                }
                throw new Error('Failed to fetch status');
            }
            const data = await res.json();
            setStatus(data);

            // Auto-show SP-API modal if Ads connected but SP not
            if (data.ads_connected && !data.sp_api_connected) {
                setShowSpApiModal(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // Determine current state
    const getState = (): GatekeeperState => {
        if (loading) return 'loading';
        if (!status || !status.ads_connected) return 'no_ads';
        if (status.ads_connected && !status.sp_api_connected) return 'partial';
        return 'full';
    };

    const currentState = getState();

    // ==================== LOADING STATE ====================
    if (currentState === 'loading') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0a0f1c]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
                    <span className="font-mono text-emerald-400">INITIALIZING GATEKEEPER...</span>
                </div>
            </div>
        );
    }

    // If error, show error state (don't fail open)
    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0a0f1c]">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-500"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // If no status loaded (should be handled by error above, but safety check)
    if (!status) {
        return <>{children}</>;
    }

    // ==================== STATE 1: NO ADS CONNECTED ====================
    // BLOCKING - The Tactician Agent cannot function without Ads API
    if (currentState === 'no_ads') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-xl border border-emerald-500/30 bg-gradient-to-b from-[#0F172A] to-[#0a1020] p-8 shadow-2xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30">
                            <ShieldCheck className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-400">STEP 1 OF 2</p>
                            <h2 className="text-2xl font-bold text-white">Connect Advertising Data</h2>
                        </div>
                    </div>

                    {/* Agent Info */}
                    <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <h3 className="mb-2 font-semibold text-emerald-300">Required for: The Tactician Agent</h3>
                        <p className="text-sm leading-relaxed text-gray-300">
                            The Tactician needs access to your Amazon Advertising data to calculate the
                            <span className="mx-1 font-mono text-emerald-400">Intraday Performance Delta (ΔP)</span>
                            and optimize your bids in real-time.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <span>Real-time bid optimization</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            <span>Marketing Stream data ingestion</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            <span>Campaign performance tracking</span>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => handleConnect('ads')}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-emerald-400"
                    >
                        Connect Amazon Ads
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        );
    }

    // ==================== STATE 2: PARTIAL - ADS CONNECTED, NO SP-API ====================
    // NON-BLOCKING - Allow dashboard access with warning banner
    if (currentState === 'partial') {
        return (
            <>
                {/* Warning Banner - Fixed at top */}
                {!dismissedWarning && (
                    <div className="fixed left-0 right-0 top-0 z-40 border-b border-amber-500/30 bg-gradient-to-r from-amber-900/90 to-orange-900/90 px-4 py-3 backdrop-blur-sm">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
                                <div>
                                    <p className="font-medium text-amber-100">
                                        Inventory Protection Disabled
                                    </p>
                                    <p className="text-sm text-amber-200/80">
                                        Connect SP-API to enable the Supply Sentinel and prevent Stockout Death Spiral.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSpApiModal(true)}
                                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                                >
                                    Connect Now
                                </button>
                                <button
                                    onClick={() => setDismissedWarning(true)}
                                    className="rounded-lg p-2 text-amber-300 transition-colors hover:bg-amber-500/20"
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
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#0F172A] to-[#0a1020] p-8 shadow-2xl">
                            {/* Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-2 ring-amber-500/30">
                                        <Server className="h-7 w-7 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-amber-400">STEP 2 OF 2</p>
                                        <h2 className="text-2xl font-bold text-white">Connect Inventory Data</h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSpApiModal(false)}
                                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Agent Info */}
                            <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                                <h3 className="mb-2 font-semibold text-amber-300">Required for: The Supply Sentinel</h3>
                                <p className="text-sm leading-relaxed text-gray-300">
                                    The Supply Sentinel needs access to your Seller Central inventory to calculate
                                    <span className="mx-1 font-mono text-amber-400">Days of Supply (DoS)</span>
                                    and
                                    <span className="mx-1 font-mono text-amber-400">Effective Lead Time (L<sub>eff</sub>)</span>.
                                </p>
                            </div>

                            {/* Warning */}
                            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                                    <div>
                                        <p className="font-medium text-red-300">Without SP-API:</p>
                                        <p className="text-sm text-gray-400">
                                            The braking multiplier (M<sub>supply</sub>) cannot be calculated.
                                            The system will operate without inventory protection, risking stockouts.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="mb-6 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Shield className="h-4 w-4 text-amber-400" />
                                    <span>Stockout Death Spiral prevention</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <TrendingUp className="h-4 w-4 text-amber-400" />
                                    <span>Inventory-aware bid dampening</span>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleConnect('sp')}
                                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4 font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-500 hover:to-amber-400"
                                >
                                    Authorize Seller Central
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </button>
                                <button
                                    onClick={() => setShowSpApiModal(false)}
                                    className="w-full rounded-lg border border-gray-600 px-6 py-3 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-300"
                                >
                                    Skip for now (not recommended)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard with padding for warning banner */}
                <div className={!dismissedWarning ? 'pt-[72px]' : ''}>
                    {children}
                </div>
            </>
        );
    }

    // ==================== STATE 3: FULL - ALL CONNECTED ====================
    return <>{children}</>;
}
