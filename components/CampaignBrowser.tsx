'use client';

import { useState, useEffect } from 'react';
import { useProfile } from './ControlPanel';
import { API_BASE } from '@/utils/api';

interface Keyword {
    keyword_id: string;
    keyword_text: string;
    match_type: string;
    bid: number;
    state: string;
}

interface Campaign {
    campaign_id: string;
    campaign_name: string;
    state: string;
    budget: number;
    keywords: Keyword[];
    keyword_count: number;
}

// Match type colors
const matchTypeColors: Record<string, string> = {
    BROAD: 'bg-brand-500/10 text-blue-light-400 border-blue-500/30',
    PHRASE: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    EXACT: 'bg-green-500/20 text-green-400 border-green-500/30',
};

// State colors
const stateColors: Record<string, string> = {
    ENABLED: 'bg-green-500/20 text-green-400',
    PAUSED: 'bg-warning-500/20 text-warning-400',
    ARCHIVED: 'bg-gray-500/20 text-gray-400',
};

export default function CampaignBrowser() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    // Get dataVersion and apiUrl from context - when dataVersion changes, refetch data
    const { dataVersion, currentProfile, switching, apiUrl } = useProfile();
    const baseUrl = apiUrl || API_BASE;

    // Fetch campaigns when dataVersion changes (profile switch)
    useEffect(() => {
        fetchCampaigns();
    }, [dataVersion]);

    const fetchCampaigns = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${baseUrl}/campaigns-browser`, { credentials: 'include' });
            const data = await response.json();

            if (data.campaigns) {
                setCampaigns(data.campaigns);
            }
            if (data.error) {
                setError(data.error);
            }
        } catch (e) {
            setError('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (campaignId: string) => {
        const newExpanded = new Set(expandedCampaigns);
        if (newExpanded.has(campaignId)) {
            newExpanded.delete(campaignId);
        } else {
            newExpanded.add(campaignId);
        }
        setExpandedCampaigns(newExpanded);
    };

    const expandAll = () => {
        setExpandedCampaigns(new Set(campaigns.map(c => c.campaign_id)));
    };

    const collapseAll = () => {
        setExpandedCampaigns(new Set());
    };

    // Filter campaigns by search
    const filteredCampaigns = campaigns.filter(campaign => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            campaign.campaign_name.toLowerCase().includes(query) ||
            campaign.keywords.some(kw => kw.keyword_text.toLowerCase().includes(query))
        );
    });

    // Stats
    const totalKeywords = campaigns.reduce((sum, c) => sum + c.keyword_count, 0);
    const enabledCampaigns = campaigns.filter(c => c.state === 'ENABLED').length;

    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        📋 Campaign Browser
                        {currentProfile && (
                            <span className="text-sm font-normal text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                                {currentProfile.country_code}
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {switching ? (
                            <span className="text-warning-400">⏳ Switching profile...</span>
                        ) : (
                            <>{campaigns.length} campaigns • {totalKeywords} keywords • {enabledCampaigns} enabled</>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search campaigns or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 pl-10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">🔍</span>
                    </div>

                    {/* Expand/Collapse buttons */}
                    <button
                        onClick={expandAll}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors"
                    >
                        Collapse All
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={fetchCampaigns}
                        disabled={loading}
                        className="px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                    >
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-error-500/5 border border-error-500/20 rounded-lg p-4 mb-4">
                    <p className="text-error-400">⚠️ {error}</p>
                </div>
            )}

            {/* Loading state */}
            {loading || switching ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {switching ? 'Switching country profile...' : 'Loading campaigns...'}
                    </span>
                </div>
            ) : (
                /* Campaign List */
                <div className="space-y-3">
                    {filteredCampaigns.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                            {searchQuery ? 'No matching campaigns found' : 'No campaigns available for this profile'}
                        </div>
                    ) : (
                        filteredCampaigns.map(campaign => (
                            <div
                                key={campaign.campaign_id}
                                className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden"
                            >
                                {/* Campaign Header (Clickable) */}
                                <button
                                    onClick={() => toggleExpand(campaign.campaign_id)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 dark:text-gray-400 transition-transform duration-200"
                                            style={{ transform: expandedCampaigns.has(campaign.campaign_id) ? 'rotate(90deg)' : 'rotate(0)' }}>
                                            ▶
                                        </span>
                                        <span className="text-gray-900 dark:text-white font-medium truncate max-w-md text-left">
                                            {campaign.campaign_name}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${stateColors[campaign.state] || stateColors.PAUSED}`}>
                                            {campaign.state}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {campaign.keyword_count} keywords
                                        </span>
                                        {campaign.budget && (
                                            <span className="text-green-400">
                                                €{typeof campaign.budget === 'number' ? campaign.budget.toFixed(2) : campaign.budget}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Keywords Table (Expanded) */}
                                {expandedCampaigns.has(campaign.campaign_id) && (
                                    <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/50">
                                        {campaign.keywords.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                                                No keywords found for this campaign (Auto campaign or no manual keywords)
                                            </div>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 dark:bg-white/[0.03]">
                                                    <tr className="text-gray-500 dark:text-gray-400 text-left">
                                                        <th className="px-4 py-2 font-medium">Keyword</th>
                                                        <th className="px-4 py-2 font-medium">Match Type</th>
                                                        <th className="px-4 py-2 font-medium">Bid</th>
                                                        <th className="px-4 py-2 font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {campaign.keywords.map((keyword, idx) => (
                                                        <tr
                                                            key={keyword.keyword_id || idx}
                                                            className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/[0.02]"
                                                        >
                                                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                                                                {keyword.keyword_text}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className={`text-xs px-2 py-0.5 rounded border ${matchTypeColors[keyword.match_type] || matchTypeColors.BROAD}`}>
                                                                    {keyword.match_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-cyan-400 font-mono">
                                                                €{keyword.bid?.toFixed(2) || '0.00'}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${stateColors[keyword.state] || stateColors.PAUSED}`}>
                                                                    {keyword.state}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
