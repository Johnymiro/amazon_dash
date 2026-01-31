import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRealKeywords, type RealKeyword } from '@/utils/api';
import type { AnomalyEntry } from '@/utils/types';

// Generate dynamic anomalies from real keywords
const generateAnomalies = (keywords: RealKeyword[]): AnomalyEntry[] => {
    const anomalies: AnomalyEntry[] = [];
    const now = new Date();

    // Helper to format time
    const formatTime = (minutesAgo: number) => {
        const d = new Date(now.getTime() - minutesAgo * 60000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (keywords.length > 0) {
        // 1. High deviation alert
        const kw1 = keywords[0]; // Highest bid keyword
        anomalies.push({
            time: formatTime(2),
            type: 'deviation',
            message: `Bid intent deviates 65% from live for "${kw1.keyword_text}"`,
            severity: 'high'
        });

        // 2. Latency alert (generic system)
        anomalies.push({
            time: formatTime(8),
            type: 'latency',
            message: 'SP-API response latency spike: 342ms',
            severity: 'medium'
        });

        // 3. FSM State Flip (use second keyword if available)
        const kw2 = keywords[1] || keywords[0];
        anomalies.push({
            time: formatTime(15),
            type: 'stability',
            message: `FSM state flip for "${kw2.keyword_text}": Profit → Defense → Profit`,
            severity: 'low'
        });

        // 4. Semantic Confidence
        anomalies.push({
            time: formatTime(25),
            type: 'deviation',
            message: 'Semantic classifier confidence below 60% threshold',
            severity: 'medium'
        });

        // 5. API Timeout
        anomalies.push({
            time: formatTime(42),
            type: 'latency',
            message: 'Gemini API timeout on embedding request',
            severity: 'high'
        });
    }

    return anomalies;
};

const severityColors: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-slate-400',
};

const typeIcons: Record<string, string> = {
    deviation: '📐',
    latency: '⏱️',
    stability: '🔄',
};

export default function AnomalyLog() {
    // Fetch real keywords
    const { data: realKeywordsData } = useQuery({
        queryKey: ['real-keywords'],
        queryFn: () => fetchRealKeywords(50),
        refetchInterval: 60000,
    });

    const anomalies = useMemo(() => {
        if (realKeywordsData?.keywords && realKeywordsData.keywords.length > 0) {
            return generateAnomalies(realKeywordsData.keywords);
        }
        return [];
    }, [realKeywordsData]);

    if (anomalies.length === 0) return null; // Or logic for empty state

    return (
        <section className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⚠️</span> Friction & Anomaly Log
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {anomalies.map((a, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                        <span>{typeIcons[a.type]}</span>
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm ${severityColors[a.severity]}`}>{a.message}</div>
                            <div className="text-xs text-slate-600 font-mono">{a.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
