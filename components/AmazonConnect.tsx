'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

    // Setup form state (only needed once to configure OAuth app)
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [region, setRegion] = useState('north_america');

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
                // Now start the OAuth flow
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
            // Map legacy region names to new format
            const regionMap: Record<string, string> = {
                'north_america': 'na',
                'europe': 'eu',
                'far_east': 'fe'
            };
            const mappedRegion = regionMap[region] || 'eu';

            // Use unified OAuth endpoint - only request Ads grant
            // Note: SP-API requires separate authorization via Seller Central
            const tenantId = user?.tenant_id || 'default';
            const params = new URLSearchParams({
                tenant_id: tenantId,
                grants: 'ads,sp',  // Request both Advertising API and SP-API grants
                region: mappedRegion,
                success_redirect: `${window.location.origin}/`,
                error_redirect: `${window.location.origin}/?error=oauth_failed`
            });

            // Redirect to unified OAuth flow
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
                    ? `✓ Connection successful!\nCampaigns found: ${data.campaigns_count}`
                    : `✓ Connection successful!\nProfiles found: ${data.profiles_count}`;
                alert(message);
            } else {
                alert(`✗ Connection test failed: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to test connection');
        }
    };

    if (loading) {
        return (
            <div className="bg-[#1c1c1e] rounded-2xl p-6 border border-[#3a3a3c]">
                <div className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2c2c2e] rounded-full"></div>
                    <div className="h-4 bg-[#2c2c2e] rounded w-32"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1c1c1e] rounded-2xl p-6 border border-[#3a3a3c]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {/* Amazon Logo */}
                    <div className="w-10 h-10 bg-gradient-to-br from-[#ff9900] to-[#ff6600] rounded-xl flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="currentColor">
                            <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595.38-.144.682-.244.907-.298.224-.053.392-.058.504-.014.112.044.18.147.204.31.024.163-.014.356-.114.58-.1.224-.254.4-.462.528-.208.128-.39.228-.547.298-1.29.592-2.903 1.07-4.84 1.434-1.937.365-3.867.547-5.79.547-4.39 0-8.154-.94-11.29-2.822-.17-.093-.26-.172-.27-.236-.01-.065.018-.135.083-.21zM12.47 14.44c-.258.41-.57.767-.933 1.066-.363.3-.762.508-1.195.625-.433.118-.917.177-1.45.177-.563 0-1.11-.07-1.64-.21-.53-.14-.955-.358-1.274-.656-.32-.297-.505-.67-.555-1.12-.05-.45.07-.97.36-1.56.29-.59.79-1.2 1.5-1.83.71-.63 1.57-1.18 2.58-1.64 1.01-.47 2.15-.79 3.42-.97-.05-.58-.22-1.02-.5-1.33-.28-.31-.59-.52-.93-.63-.34-.11-.75-.17-1.24-.17-.52 0-1.01.06-1.48.19-.47.13-.87.32-1.2.57-.33.25-.58.55-.75.9-.17.35-.25.75-.24 1.19h-1.95c.01-.73.18-1.37.5-1.93.32-.56.76-1.03 1.32-1.41.56-.38 1.2-.66 1.93-.84.73-.18 1.49-.27 2.28-.27.99 0 1.86.14 2.6.43.74.29 1.33.71 1.77 1.28.44.57.66 1.28.66 2.14v3.97c0 .51.12.88.36 1.11.24.23.57.35.99.35.26 0 .56-.06.9-.18l.09 1.52c-.35.14-.76.24-1.22.3-.46.06-.84.09-1.12.09-.91 0-1.58-.25-2.01-.75-.43-.5-.65-1.22-.64-2.16h-.03zm-.11-3.43c-.95.17-1.78.43-2.49.77-.71.34-1.25.73-1.62 1.17-.37.44-.55.93-.55 1.47 0 .58.17 1.01.52 1.27.35.26.83.39 1.46.39.96 0 1.8-.28 2.51-.84.71-.56 1.06-1.32 1.06-2.27v-1.96h-.89z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Amazon Seller Account</h3>
                        <p className="text-[#8e8e93] text-sm">
                            {status?.connected ? status.account_name || 'Connected' : 'Not connected'}
                        </p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${status?.connected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#2c2c2e] text-[#8e8e93] border border-[#3a3a3c]'
                    }`}>
                    {status?.connected ? '● Live' : '○ Offline'}
                </div>
            </div>

            {/* Connected State */}
            {status?.connected && (
                <div className="space-y-4">
                    {/* Account Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#2c2c2e] rounded-xl p-4">
                            <p className="text-[#8e8e93] text-xs mb-1">Account</p>
                            <p className="text-white font-mono text-sm">{status.account_name || 'Seller Account'}</p>
                        </div>
                        <div className="bg-[#2c2c2e] rounded-xl p-4">
                            <p className="text-[#8e8e93] text-xs mb-1">Marketplace</p>
                            <p className="text-white font-mono text-sm">{status.marketplace || 'US'}</p>
                        </div>
                        <div className="bg-[#2c2c2e] rounded-xl p-4">
                            <p className="text-[#8e8e93] text-xs mb-1">Profile ID</p>
                            <p className="text-white font-mono text-sm truncate">{status.profile_id || '—'}</p>
                        </div>
                        <div className="bg-[#2c2c2e] rounded-xl p-4">
                            <p className="text-[#8e8e93] text-xs mb-1">Last Sync</p>
                            <p className="text-white font-mono text-sm">
                                {status.last_sync ? new Date(status.last_sync).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleTestConnection}
                            className="flex-1 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                        >
                            Test Connection
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors border border-red-500/30"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            )}

            {/* Disconnected State - Show Connect Button */}
            {!status?.connected && !showSetup && (
                <div className="space-y-4">
                    <p className="text-[#8e8e93] text-sm">
                        Connect your Amazon Seller account to enable real-time bidding and inventory sync.
                    </p>

                    {/* Region Selector */}
                    <div className="flex gap-3 items-center">
                        <span className="text-[#8e8e93] text-sm">Region:</span>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="bg-[#2c2c2e] border border-[#3a3a3c] rounded-xl px-4 py-2 text-white text-sm focus:border-[#ff9900] focus:outline-none"
                        >
                            <option value="north_america">North America (US, CA, MX)</option>
                            <option value="europe">Europe (UK, DE, FR, ES, IT)</option>
                            <option value="far_east">Far East (JP, AU)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleConnectWithOAuth}
                        disabled={connecting}
                        className="w-full bg-gradient-to-r from-[#ff9900] to-[#ff6600] hover:from-[#ffaa22] hover:to-[#ff7722] text-black font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {connecting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595.38-.144.682-.244.907-.298.224-.053.392-.058.504-.014.112.044.18.147.204.31.024.163-.014.356-.114.58-.1.224-.254.4-.462.528-.208.128-.39.228-.547.298-1.29.592-2.903 1.07-4.84 1.434-1.937.365-3.867.547-5.79.547-4.39 0-8.154-.94-11.29-2.822-.17-.093-.26-.172-.27-.236-.01-.065.018-.135.083-.21z" />
                                </svg>
                                Connect with Amazon
                            </>
                        )}
                    </button>

                    <p className="text-[#636366] text-xs text-center">
                        You'll be redirected to Amazon to log in and grant permission
                    </p>
                </div>
            )}

            {/* OAuth Setup Form (shown if credentials not configured) */}
            {!status?.connected && showSetup && (
                <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                        <p className="text-amber-400 text-sm">
                            <strong>⚠️ First-Time Setup</strong><br />
                            Enter your Amazon Developer App credentials. You only need to do this once.
                            <a href="https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html"
                                target="_blank"
                                className="underline ml-1">
                                Get credentials →
                            </a>
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-[#8e8e93] text-xs mb-1 block">Client ID *</label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="amzn1.application-oa2-client.xxxxx"
                                className="w-full bg-[#2c2c2e] border border-[#3a3a3c] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#636366] focus:border-[#ff9900] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-[#8e8e93] text-xs mb-1 block">Client Secret *</label>
                            <input
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder="Your client secret"
                                className="w-full bg-[#2c2c2e] border border-[#3a3a3c] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#636366] focus:border-[#ff9900] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowSetup(false)}
                            className="flex-1 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSetupOAuth}
                            disabled={connecting}
                            className="flex-1 bg-gradient-to-r from-[#ff9900] to-[#ff6600] hover:from-[#ffaa22] hover:to-[#ff7722] text-black font-semibold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
                        >
                            {connecting ? 'Setting up...' : 'Continue to Amazon'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
