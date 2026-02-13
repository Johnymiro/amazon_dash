'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link2, Unlink, TestTube, ChevronDown } from 'lucide-react';

interface ConnectionStatus {
    connected: boolean;
    account_name?: string;
    marketplace?: string;
    profile_id?: string;
    status?: string;
    last_sync?: string;
}

interface OAuthConfig {
    configured: boolean;
    client_id?: string;
    redirect_uri?: string;
}

interface AmazonConnectProps {
    apiUrl?: string;
}

export default function AmazonConnect({ apiUrl = '' }: AmazonConnectProps) {
    const { user } = useAuth();
    const [status, setStatus] = useState<ConnectionStatus | null>(null);
    const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [showSetup, setShowSetup] = useState(false);

    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [region, setRegion] = useState('europe');

    useEffect(() => {
        fetchStatus();
        fetchOAuthConfig();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${apiUrl}/amazon/status`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch Amazon status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOAuthConfig = async () => {
        try {
            const res = await fetch(`${apiUrl}/amazon/oauth/config`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setOauthConfig(data);
            }
        } catch (error) {
            console.error('Failed to fetch OAuth config:', error);
        }
    };

    const handleSetupOAuth = async () => {
        if (!clientId || !clientSecret) {
            alert('Please fill in Client ID and Client Secret');
            return;
        }

        setConnecting(true);
        try {
            const res = await fetch(`${apiUrl}/amazon/oauth/config`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: `${apiUrl}/amazon/oauth/callback`
                })
            });

            if (res.ok) {
                setOauthConfig({ configured: true, client_id: clientId.slice(0, 20) + '...' });
                setShowSetup(false);
                handleConnectWithOAuth();
            } else {
                const error = await res.json();
                alert(`Setup failed: ${error.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to setup OAuth:', error);
            alert('Failed to configure OAuth');
        } finally {
            setConnecting(false);
        }
    };

    const handleConnectWithOAuth = async () => {
        setConnecting(true);
        try {
            const regionMap: Record<string, string> = {
                'north_america': 'na',
                'europe': 'eu',
                'far_east': 'fe'
            };
            const mappedRegion = regionMap[region] || 'eu';

            const tenantId = user?.tenant_id || 'default';
            const params = new URLSearchParams({
                tenant_id: tenantId,
                grants: 'ads',
                region: mappedRegion,
                success_redirect: `${window.location.origin}/`,
                error_redirect: `${window.location.origin}/?error=oauth_failed`
            });

            window.location.href = `${apiUrl}/oauth/unified/authorize?${params.toString()}`;
        } catch (error) {
            console.error('Failed to start OAuth:', error);
            alert('Failed to connect to server');
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Amazon account?')) {
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/amazon/disconnect`, {
                method: 'POST',
                credentials: 'include'
            });

            if (res.ok) {
                setStatus({ connected: false });
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    const handleTestConnection = async () => {
        try {
            const res = await fetch(`${apiUrl}/amazon/test`, { credentials: 'include' });
            const data = await res.json();

            if (data.success) {
                const message = data.campaigns_count !== undefined
                    ? `Connection successful!\nCampaigns found: ${data.campaigns_count}`
                    : `Connection successful!\nProfiles found: ${data.profiles_count}`;
                alert(message);
            } else {
                alert(`Connection test failed: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to test connection');
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-6">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-32"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-theme-xs">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="currentColor">
                            <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595.38-.144.682-.244.907-.298.224-.053.392-.058.504-.014.112.044.18.147.204.31.024.163-.014.356-.114.58-.1.224-.254.4-.462.528-.208.128-.39.228-.547.298-1.29.592-2.903 1.07-4.84 1.434-1.937.365-3.867.547-5.79.547-4.39 0-8.154-.94-11.29-2.822-.17-.093-.26-.172-.27-.236-.01-.065.018-.135.083-.21zM12.47 14.44c-.258.41-.57.767-.933 1.066-.363.3-.762.508-1.195.625-.433.118-.917.177-1.45.177-.563 0-1.11-.07-1.64-.21-.53-.14-.955-.358-1.274-.656-.32-.297-.505-.67-.555-1.12-.05-.45.07-.97.36-1.56.29-.59.79-1.2 1.5-1.83.71-.63 1.57-1.18 2.58-1.64 1.01-.47 2.15-.79 3.42-.97-.05-.58-.22-1.02-.5-1.33-.28-.31-.59-.52-.93-.63-.34-.11-.75-.17-1.24-.17-.52 0-1.01.06-1.48.19-.47.13-.87.32-1.2.57-.33.25-.58.55-.75.9-.17.35-.25.75-.24 1.19h-1.95c.01-.73.18-1.37.5-1.93.32-.56.76-1.03 1.32-1.41.56-.38 1.2-.66 1.93-.84.73-.18 1.49-.27 2.28-.27.99 0 1.86.14 2.6.43.74.29 1.33.71 1.77 1.28.44.57.66 1.28.66 2.14v3.97c0 .51.12.88.36 1.11.24.23.57.35.99.35.26 0 .56-.06.9-.18l.09 1.52c-.35.14-.76.24-1.22.3-.46.06-.84.09-1.12.09-.91 0-1.58-.25-2.01-.75-.43-.5-.65-1.22-.64-2.16h-.03zm-.11-3.43c-.95.17-1.78.43-2.49.77-.71.34-1.25.73-1.62 1.17-.37.44-.55.93-.55 1.47 0 .58.17 1.01.52 1.27.35.26.83.39 1.46.39.96 0 1.8-.28 2.51-.84.71-.56 1.06-1.32 1.06-2.27v-1.96h-.89z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Amazon Seller Account</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-theme-xs">
                            {status?.connected ? status.account_name || 'Connected' : 'Not connected'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {status?.connected && (
                        <>
                            <button
                                onClick={handleTestConnection}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-700 dark:text-gray-300 py-1.5 px-3 text-theme-xs font-medium transition-colors"
                            >
                                <TestTube className="h-3.5 w-3.5" /> Test
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center gap-1.5 rounded-lg border border-error-500/20 bg-error-500/5 hover:bg-error-500/10 text-error-400 py-1.5 px-3 text-theme-xs font-medium transition-colors"
                            >
                                <Unlink className="h-3.5 w-3.5" /> Disconnect
                            </button>
                        </>
                    )}
                    <div className={`px-3 py-1 rounded-full text-theme-xs font-medium ${status?.connected
                        ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-700'
                        }`}>
                        {status?.connected ? 'Live' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Connected State — compact inline row */}
            {status?.connected && (
                <div className="mt-4 flex items-center gap-3 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 dark:text-gray-500 text-theme-xs">Account</span>
                        <span className="text-gray-900 dark:text-white font-mono text-theme-xs">{status.account_name || 'Seller Account'}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 dark:text-gray-500 text-theme-xs">Marketplace</span>
                        <span className="text-gray-900 dark:text-white font-mono text-theme-xs">{status.marketplace || 'US'}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 dark:text-gray-500 text-theme-xs">Profile</span>
                        <span className="text-gray-900 dark:text-white font-mono text-theme-xs truncate max-w-[120px]">{status.profile_id || '\u2014'}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 dark:text-gray-500 text-theme-xs">Last Sync</span>
                        <span className="text-gray-900 dark:text-white font-mono text-theme-xs">
                            {status.last_sync ? new Date(status.last_sync).toLocaleString() : 'Never'}
                        </span>
                    </div>
                </div>
            )}

            {/* Disconnected State */}
            {!status?.connected && !showSetup && (
                <div className="space-y-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Connect your Amazon Seller account to enable real-time bidding and inventory sync.
                    </p>

                    <div className="flex gap-3 items-center">
                        <span className="text-gray-400 dark:text-gray-500 text-sm">Region:</span>
                        <div className="relative">
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="appearance-none h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 pr-8 text-gray-900 dark:text-white text-sm focus:border-brand-800 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                            >
                                <option value="europe">Europe (UK, DE, FR, ES, IT)</option>
                                <option value="north_america">North America (US, CA, MX)</option>
                                <option value="far_east">Far East (JP, AU)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={handleConnectWithOAuth}
                        disabled={connecting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold py-3 px-4 text-sm transition-all disabled:opacity-50 shadow-theme-xs"
                    >
                        {connecting ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Link2 className="h-5 w-5" />
                                Connect with Amazon
                            </>
                        )}
                    </button>

                    <p className="text-gray-400 dark:text-gray-500 text-theme-xs text-center">
                        You'll be redirected to Amazon to log in and grant permission
                    </p>
                </div>
            )}

            {/* OAuth Setup Form */}
            {!status?.connected && showSetup && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-warning-500/20 bg-warning-500/5 p-4 mb-4">
                        <p className="text-warning-400 text-sm">
                            <strong>First-Time Setup</strong><br />
                            Enter your Amazon Developer App credentials. You only need to do this once.
                            <a href="https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html"
                                target="_blank"
                                className="underline ml-1 text-warning-300">
                                Get credentials
                            </a>
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-gray-500 dark:text-gray-400 text-theme-xs mb-1.5 block font-medium">Client ID *</label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="amzn1.application-oa2-client.xxxxx"
                                className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-600 focus:border-brand-800 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                            />
                        </div>

                        <div>
                            <label className="text-gray-500 dark:text-gray-400 text-theme-xs mb-1.5 block font-medium">Client Secret *</label>
                            <input
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder="Your client secret"
                                className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-600 focus:border-brand-800 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowSetup(false)}
                            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-900 dark:text-white py-2.5 px-4 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSetupOAuth}
                            disabled={connecting}
                            className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold py-2.5 px-4 text-sm transition-all disabled:opacity-50 shadow-theme-xs"
                        >
                            {connecting ? 'Setting up...' : 'Continue to Amazon'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
