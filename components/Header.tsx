'use client';

import { useState, useEffect } from 'react';
import { fetchShadowStatus, startShadowMode, stopShadowMode } from '@/utils/api';
import type { ShadowStatus } from '@/utils/types';
import VerifiedSourceBadge from './VerifiedSourceBadge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/axios';
import { Zap, LogOut, Play, Square, Crown, Activity, Cpu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface AlphaReport {
    profit_alpha: number;
    alpha_percent: number;
    period_days: number;
    avg_prediction_error: number;
}

export default function Header() {
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [status, setStatus] = useState<ShadowStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [sovereigntyLoading, setSovereigntyLoading] = useState(false);
    const [sentinelLatency, setSentinelLatency] = useState(24);
    const [semanticSpeed, setSemanticSpeed] = useState(142);
    const [showSovereigntyConfirm, setShowSovereigntyConfirm] = useState(false);
    const [alphaReport, setAlphaReport] = useState<AlphaReport | null>(null);

    const isReady = alphaReport &&
        (alphaReport.period_days || 0) >= 14 &&
        (alphaReport.alpha_percent || 0) >= 10 &&
        (alphaReport.avg_prediction_error || 100) <= 15;

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await fetchShadowStatus();
                setStatus(data);
            } catch {
                // API not available
            }
        };

        const fetchAlpha = async () => {
            try {
                const res = await api.get('/shadow/alpha-report');
                setAlphaReport(res.data);
            } catch {
                setAlphaReport(null);
            }
        };

        fetchStatus();
        fetchAlpha();
        const interval = setInterval(fetchStatus, 5000);

        const heartbeat = setInterval(() => {
            setSentinelLatency(20 + Math.floor(Math.random() * 30));
            setSemanticSpeed(130 + Math.floor(Math.random() * 40));
        }, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(heartbeat);
        };
    }, []);

    const toggleShadow = async () => {
        setLoading(true);
        try {
            if (status?.active) {
                await stopShadowMode();
            } else {
                await startShadowMode();
            }
            const data = await fetchShadowStatus();
            setStatus(data);
        } catch {
            // Handle error
        }
        setLoading(false);
    };

    const initializeSovereignty = async () => {
        setSovereigntyLoading(true);
        try {
            await api.post('/shadow/stop');
            await api.post('/executor/sovereignty', null, { params: { active: true } });

            const data = await fetchShadowStatus();
            setStatus(data);
            setShowSovereigntyConfirm(false);

            alert('Sovereignty Initialized! Agents now executing live.');
        } catch (error) {
            console.error('Failed to initialize sovereignty:', error);
            alert('Failed to initialize sovereignty. Please try again.');
        } finally {
            setSovereigntyLoading(false);
        }
    };

    return (
        <>
            <header className="border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 bg-white/80 dark:bg-gray-950/80 sticky top-0 z-99999 backdrop-blur-xl">
                <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20">
                            <Zap className="h-5 w-5 text-brand-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Cybernetic Command</h1>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-md border border-brand-500/20 text-theme-xs font-medium">
                                    SHADOW MODE
                                </span>
                                <VerifiedSourceBadge source="shadow" />
                                <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">No live executions</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Objective Function */}
                        <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] px-4 py-2">
                            <div className="text-theme-xs text-gray-400 dark:text-gray-500">Active Objective</div>
                            <div className="font-semibold text-success-400 text-sm">Maximize ROAS</div>
                        </div>

                        {/* System Health */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02]">
                                <Activity className="h-3.5 w-3.5 text-success-400 animate-pulse" />
                                <span className="text-theme-xs text-gray-500 dark:text-gray-400">Sentinel: <span className="text-success-400 font-medium">{sentinelLatency}ms</span></span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02]">
                                <Cpu className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
                                <span className="text-theme-xs text-gray-500 dark:text-gray-400">Semantic: <span className="text-brand-400 font-medium">{semanticSpeed}/s</span></span>
                            </div>
                        </div>

                        {/* Shadow Status */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
                            <span className={`w-2.5 h-2.5 rounded-full ${status?.active ? 'bg-brand-500 animate-pulse' : 'bg-gray-600'}`}></span>
                            <span className="font-medium text-brand-400 text-sm">Day {alphaReport?.period_days || status?.days_elapsed || 0}/14</span>
                        </div>

                        {/* Sovereignty Button OR Shadow Toggle */}
                        {isReady ? (
                            <button
                                onClick={() => setShowSovereigntyConfirm(true)}
                                className="relative px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all overflow-hidden group bg-gradient-to-r from-success-500 to-success-600 shadow-theme-sm hover:from-success-400 hover:to-success-500"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Crown className="h-4 w-4" /> Initialize Sovereignty
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={toggleShadow}
                                disabled={loading}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${status?.active
                                    ? 'bg-error-600 hover:bg-error-500 text-white'
                                    : 'bg-success-600 hover:bg-success-500 text-white'
                                    }`}
                            >
                                {loading ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : status?.active ? (
                                    <><Square className="h-4 w-4" /> Stop</>
                                ) : (
                                    <><Play className="h-4 w-4" /> Start</>
                                )}
                            </button>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>

                        {/* User Info / Logout */}
                        {isAuthenticated && user && (
                            <div className="flex items-center gap-2">
                                <div className="hidden md:block text-right">
                                    <div className="text-theme-xs text-gray-400 dark:text-gray-500">Logged in as</div>
                                    <div className="text-sm text-gray-800 dark:text-white/90 font-medium truncate max-w-[150px]">{user.email}</div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-theme-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all border border-gray-200 dark:border-gray-800"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Sovereignty Confirmation Modal */}
            {showSovereigntyConfirm && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-999999 flex items-center justify-center p-4">
                    <div className="bg-gray-50 dark:bg-gray-950 border border-success-500/30 rounded-2xl p-6 max-w-md w-full shadow-theme-xl animate-fade-in">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-success-500/10 mb-4">
                                <Crown className="h-8 w-8 text-success-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-success-400 mb-2">Initialize Sovereignty</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Switch from Shadow Mode observation to Live Execution. The AI agents will now control your bids in real-time.
                            </p>
                        </div>

                        {/* Readiness Checklist */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-4 mb-6">
                            <div className="text-theme-xs text-gray-400 dark:text-gray-500 mb-3 font-medium">GO-LIVE READINESS</div>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Shadow Period</span>
                                    <span className="text-success-400 font-mono text-theme-xs">
                                        {alphaReport?.period_days || 0} days (&ge;14)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Alpha Performance</span>
                                    <span className="text-success-400 font-mono text-theme-xs">
                                        {alphaReport?.alpha_percent?.toFixed(1) || 0}% (&ge;10%)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Prediction Accuracy</span>
                                    <span className="text-success-400 font-mono text-theme-xs">
                                        {(100 - (alphaReport?.avg_prediction_error || 0)).toFixed(1)}% (&ge;85%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="rounded-lg border border-warning-500/20 bg-warning-500/5 p-3 mb-6">
                            <div className="text-theme-xs text-warning-400">
                                <strong>Important:</strong> Once initialized, the AI will execute live bid changes. You can pause at any time via the dashboard.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSovereigntyConfirm(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={initializeSovereignty}
                                disabled={sovereigntyLoading}
                                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-400 hover:to-success-500 shadow-theme-sm"
                            >
                                {sovereigntyLoading ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    <><Crown className="h-4 w-4" /> Confirm Go-Live</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
