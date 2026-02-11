// API client for FastAPI backend - Using HttpOnly Cookie Auth
// All requests include credentials for secure authentication

import { api } from './axios';
import type { ShadowStatus, PerformanceScorecard, AlphaReportResponse, ShadowBidsResponse } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ═══════════════════════════════════════════════════════════════
// SHADOW MODE API
// ═══════════════════════════════════════════════════════════════

export async function fetchShadowStatus(): Promise<ShadowStatus> {
    const res = await api.get('/shadow/status');
    return res.data;
}

export async function startShadowMode(): Promise<{ status: string; message: string }> {
    const res = await api.post('/shadow/start');
    return res.data;
}

export async function stopShadowMode(): Promise<{ status: string; message: string }> {
    const res = await api.post('/shadow/stop');
    return res.data;
}

export async function fetchPerformance(): Promise<PerformanceScorecard> {
    const res = await api.get('/shadow/performance');
    return res.data;
}

export async function runValidation() {
    const res = await api.get('/shadow/validation');
    return res.data;
}

// ═══════════════════════════════════════════════════════════════
// AGENT APIS
// ═══════════════════════════════════════════════════════════════

export async function evaluateStrategist(data: {
    asin: string;
    dos: number;
    l_eff: number;
    current_state: string;
}) {
    const res = await api.post('/agents/strategist/evaluate', data);
    return res.data;
}

export async function calculateBid(data: {
    asin: string;
    keyword_id: string;
    base_bid: number;
    clicks: number;
    cpc_realtime: number;
    dos: number;
    l_eff: number;
}) {
    const res = await api.post('/agents/tactician/bid', data);
    return res.data;
}

export async function scanInventory(asin: string) {
    const res = await api.post('/agents/sentinel/scan', { asin });
    return res.data;
}

export async function classifyTerm(search_term: string, product_asin: string) {
    const res = await api.post('/agents/semantic/classify', { search_term, product_asin });
    return res.data;
}

// ═══════════════════════════════════════════════════════════════
// ALPHA REPORT API
// ═══════════════════════════════════════════════════════════════

export async function fetchAlphaReport(): Promise<AlphaReportResponse> {
    const res = await api.get('/shadow/alpha-report');
    return res.data;
}

export async function fetchShadowBids(limit: number = 20): Promise<ShadowBidsResponse> {
    const res = await api.get(`/shadow/recent-bids?limit=${limit}`);
    return res.data;
}

// ═══════════════════════════════════════════════════════════════
// KEYWORDS API (Amazon Ads - Read Only)
// ═══════════════════════════════════════════════════════════════

export interface RealKeyword {
    keyword_id: string;
    keyword_text: string;
    match_type: string;
    current_bid: number;
}

export interface RealKeywordsResponse {
    mode: string;
    count: number;
    keywords: RealKeyword[];
}

export async function fetchRealKeywords(limit: number = 50): Promise<RealKeywordsResponse> {
    const res = await api.get(`/keywords?limit=${limit}`);
    return res.data;
}
