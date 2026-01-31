// API types for Shadow Mode Dashboard

export interface KeywordComparison {
    id: string;
    keyword: string;
    currentBid: number;
    optimalBid: number;
    state: 'launch' | 'profit' | 'defense' | 'rationing' | 'liquidation';
    deltaP: number;
    trace: LogicTrace;
}

export interface LogicTrace {
    state: string;
    trigger: string;
    telemetry: string;
    action: string;
}

export interface StrategistInsight {
    type: 'leaky_bucket' | 'hidden_gem' | 'opportunity' | 'warning';
    title: string;
    desc: string;
    action: string;
}

export interface AnomalyEntry {
    time: string;
    type: 'deviation' | 'latency' | 'stability';
    message: string;
    severity: 'high' | 'medium' | 'low';
}

export interface DeadbandProduct {
    name: string;
    dos: number;
    leff: number;
    state: 'launch' | 'profit' | 'defense' | 'rationing' | 'liquidation';
}

export interface ShadowStatus {
    active: boolean;
    start_date?: string;
    days_elapsed?: number;
    days_remaining?: number;
    progress_pct?: number;
    stats?: {
        simulated_bids: number;
        state_transitions: number;
        semantic_decisions: number;
    };
    recent_activity?: ActivityEntry[];
    message?: string;
}

export interface ActivityEntry {
    timestamp: string;
    emoji: string;
    message: string;
    agent: string;
}

export interface PerformanceScorecard {
    overall: {
        score: number;
        status: string;
        color: string;
        ready_for_live: boolean;
    };
    agents: {
        strategist: AgentScore;
        tactician: AgentScore;
        sentinel: AgentScore;
        semantic: AgentScore;
    };
    priority_improvements: PriorityImprovement[];
}

export interface AgentScore {
    score: number;
    status: string;
    issues: string[];
    improvements: string[];
    evaluations?: number;
    bids_calculated?: number;
    scans?: number;
    classifications?: number;
}

export interface PriorityImprovement {
    action: string;
    agent: string;
    priority: number;
}

// ═══════════════════════════════════════════════════════════════
// ALPHA REPORT API CONTRACT
// This interface MUST match the /shadow/alpha-report response
// ═══════════════════════════════════════════════════════════════

export interface AlphaReportResponse {
    status: 'success' | 'no_session' | 'collecting' | 'error';
    session_id?: number;
    snapshot_timestamp?: string;  // ISO timestamp of last snapshot
    age_minutes?: number;         // How old the snapshot is
    source?: 'snapshot' | 'live_calculation';  // Data source
    days_elapsed: number;
    days_remaining: number;
    progress_pct: number;
    message?: string;

    summary: {
        total_bids_analyzed: number;
        profit_alpha: number;
        alpha_pct: number;
        recommendation: string;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        ready_for_live: boolean;
    };

    financials: {
        live_baseline: {
            spend: number;
            sales: number;
            profit: number;
        };
        shadow_intent: {
            predicted_sales: number;
            supply_dampened_sales?: number;  // Sentinel-adjusted sales
            estimated_profit: number;
        };
        comparison: {
            profit_alpha: number;
            alpha_pct: number;
            interpretation: string;
        };
    };

    costs?: {
        total_cogs: number;
        total_fba_fees: number;
        cogs_rate_pct: number;
        fba_fee_rate_pct: number;
    };

    efficiency: {
        overheated_auctions_detected: number;
        wasted_spend_identified: number;
        hidden_gems_found: number;
    };

    reconciliation: {
        bids_with_actual_data: number;
        pending_attribution: number;
        avg_prediction_error_pct: number;
    };

    formula: {
        description: string;
        profit_alpha_formula: string;
        alpha_pct_formula: string;
        note?: string;  // M_supply braking explanation
    };

    // Backend-calculated Success Fee (Math Sovereignty)
    success_fee: {
        fee_rate_pct: number;
        amount: number;
        net_profit: number;
        roi: number;
    };
}

// Shadow Bids API Contract
export interface ShadowBid {
    id: number;
    keyword_id: string;
    optimal_bid: number;
    current_bid: number;
    alpha_delta_pct: number;
    fsm_state: string;
    m_supply: number;
    delta_p: number;
    sales_pred: number;
    trigger: string;
    reasoning: string;
    timestamp: string;
}

export interface ShadowBidsResponse {
    count: number;
    bids: ShadowBid[];
}

