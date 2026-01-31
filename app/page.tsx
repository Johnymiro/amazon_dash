'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import IntegrityBanner from '@/components/IntegrityBanner';
import ProfitAlphaScorecard from '@/components/ProfitAlphaScorecard';
import ComparisonMatrix from '@/components/ComparisonMatrix';
import GhostDataChart from '@/components/GhostDataChart';
import SigmoidEditor from '@/components/SigmoidEditor';
import AIScorecard from '@/components/AIScorecard';
import StrategistInsights from '@/components/StrategistInsights';
import DeadbandGauges from '@/components/DeadbandGauges';
import AnomalyLog from '@/components/AnomalyLog';
import AmazonConnect from '@/components/AmazonConnect';
import AuditHistory from '@/components/AuditHistory';
import GalaxyMap from '@/components/GalaxyMap';
import IntelligenceBriefing from '@/components/IntelligenceBriefing';
import EnterpriseOverview from '@/components/EnterpriseOverview';
import ProfitCalculator from '@/components/ProfitCalculator';
import ControlPanel, { ProfileProvider } from '@/components/ControlPanel';
import CampaignBrowser from '@/components/CampaignBrowser';
import LiveShadowTicker from '@/components/LiveShadowTicker';
import MultiAgentTelemetry from '@/components/MultiAgentTelemetry';
import UCCLPanel from '@/components/UCCLPanel';
import LogViewer from '@/components/LogViewer';
import { API_BASE } from '@/utils/api';
import DashboardGatekeeper from '@/components/DashboardGatekeeper';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

type Tab = 'dashboard' | 'campaigns' | 'audit' | 'galaxy' | 'enterprise' | 'billing' | 'briefing' | 'logs';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <ProtectedRoute>
      <ProfileProvider apiUrl={API_BASE}>
        <DashboardGatekeeper>
          <div className="min-h-screen bg-[#121212]">
            <IntegrityBanner />
            <Header />


            {/* Tab Navigation */}
            <div className="max-w-[1800px] mx-auto px-6 pt-6">
              <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-xl w-fit border border-slate-800 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'campaigns'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  📋 Campaigns
                </button>
                <button
                  onClick={() => setActiveTab('galaxy')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'galaxy'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  🌌 Semantic Galaxy
                </button>
                <button
                  onClick={() => setActiveTab('enterprise')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'enterprise'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  🏢 Enterprise
                </button>
                <button
                  onClick={() => setActiveTab('briefing')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'briefing'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  📄 Briefing
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'billing'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  💰 Billing
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'audit'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  📜 Audit History
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'logs'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  🖥️ Logs
                </button>
              </div>
            </div>

            <main className="max-w-[1800px] mx-auto p-6 space-y-6">
              {activeTab === 'dashboard' && (
                <>
                  {/* Control Panel: Country Selector + Shadow Mode */}
                  <ControlPanel />

                  {/* Section 0: Amazon Account Connection */}
                  <AmazonConnect apiUrl={API_BASE} />

                  {/* Section 1: Profit Alpha Scorecard */}
                  <ProfitAlphaScorecard />

                  {/* Section 2: Reality vs Shadow Comparison */}
                  <ComparisonMatrix />

                  {/* Section 2.5: Live Shadow Ticker - Real-time Decision Stream */}
                  <LiveShadowTicker />

                  {/* Section 2.75: Multi-Agent Decision Trace */}
                  <MultiAgentTelemetry />

                  {/* Section 2.9: UCCL - Unified Command Log */}
                  <UCCLPanel />

                  {/* Section 3: Ghost Data + Sigmoid (What-If Simulator) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GhostDataChart />
                    <SigmoidEditor />
                  </div>

                  {/* Section 4: Scorecard + Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <AIScorecard />
                    <StrategistInsights />
                  </div>

                  {/* Section 5: Deadband (Hysteresis Stress-Test) + Anomalies */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DeadbandGauges />
                    <AnomalyLog />
                  </div>
                </>
              )}

              {activeTab === 'galaxy' && (
                <GalaxyMap />
              )}

              {activeTab === 'campaigns' && (
                <>
                  {/* Control Panel: Country Selector + Shadow Mode */}
                  <ControlPanel />

                  {/* Campaign Browser */}
                  <CampaignBrowser />
                </>
              )}


              {activeTab === 'enterprise' && (
                <EnterpriseOverview />
              )}

              {activeTab === 'briefing' && (
                <IntelligenceBriefing />
              )}

              {activeTab === 'billing' && (
                <ProfitCalculator />
              )}

              {activeTab === 'audit' && (
                <AuditHistory />
              )}

              {activeTab === 'logs' && (
                <LogViewer />
              )}
            </main>
          </div>
        </DashboardGatekeeper>
      </ProfileProvider>
    </ProtectedRoute>
  );
}
