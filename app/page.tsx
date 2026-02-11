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
import { BarChart3, Layers, Sparkles, Building2, FileText, Wallet, ScrollText, Terminal } from 'lucide-react';

type Tab = 'dashboard' | 'campaigns' | 'audit' | 'galaxy' | 'enterprise' | 'billing' | 'briefing' | 'logs';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'campaigns', label: 'Campaigns', icon: <Layers className="h-4 w-4" /> },
  { id: 'galaxy', label: 'Semantic Galaxy', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'enterprise', label: 'Enterprise', icon: <Building2 className="h-4 w-4" /> },
  { id: 'briefing', label: 'Briefing', icon: <FileText className="h-4 w-4" /> },
  { id: 'billing', label: 'Billing', icon: <Wallet className="h-4 w-4" /> },
  { id: 'audit', label: 'Audit History', icon: <ScrollText className="h-4 w-4" /> },
  { id: 'logs', label: 'Logs', icon: <Terminal className="h-4 w-4" /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <ProtectedRoute>
      <ProfileProvider apiUrl={API_BASE}>
        <DashboardGatekeeper>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <IntegrityBanner />
            <Header />

            {/* Tab Navigation */}
            <div className="max-w-[1800px] mx-auto px-4 md:px-6 pt-6">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-fit overflow-x-auto no-scrollbar shadow-theme-xs dark:shadow-none">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-brand-500 text-white shadow-theme-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <main className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">
              {activeTab === 'dashboard' && (
                <>
                  <ControlPanel />
                  <AmazonConnect apiUrl={API_BASE} />
                  <ProfitAlphaScorecard />
                  <ComparisonMatrix />
                  <LiveShadowTicker />
                  <MultiAgentTelemetry />
                  <UCCLPanel />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GhostDataChart />
                    <SigmoidEditor />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <AIScorecard />
                    <StrategistInsights />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DeadbandGauges />
                    <AnomalyLog />
                  </div>
                </>
              )}

              {activeTab === 'galaxy' && <GalaxyMap />}

              {activeTab === 'campaigns' && (
                <>
                  <ControlPanel />
                  <CampaignBrowser />
                </>
              )}

              {activeTab === 'enterprise' && <EnterpriseOverview />}
              {activeTab === 'briefing' && <IntelligenceBriefing />}
              {activeTab === 'billing' && <ProfitCalculator />}
              {activeTab === 'audit' && <AuditHistory />}
              {activeTab === 'logs' && <LogViewer />}
            </main>
          </div>
        </DashboardGatekeeper>
      </ProfileProvider>
    </ProtectedRoute>
  );
}
