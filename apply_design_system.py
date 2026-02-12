#!/usr/bin/env python3
"""Apply design system color pattern replacements across component files."""

import os
import re

COMPONENTS_DIR = os.path.dirname(os.path.abspath(__file__)) + '/components'

FILES = [
    'ComparisonMatrix.tsx',
    'GhostDataChart.tsx',
    'SigmoidEditor.tsx',
    'AIScorecard.tsx',
    'StrategistInsights.tsx',
    'DeadbandGauges.tsx',
    'AnomalyLog.tsx',
    'AmazonConnect.tsx',
    'AuditHistory.tsx',
    'GalaxyMap.tsx',
    'IntelligenceBriefing.tsx',
    'EnterpriseOverview.tsx',
    'ProfitCalculator.tsx',
    'CampaignBrowser.tsx',
    'LiveShadowTicker.tsx',
    'MultiAgentTelemetry.tsx',
    'UCCLPanel.tsx',
    'LogViewer.tsx',
    'VerifiedSourceBadge.tsx',
    'MissedProfitTicker.tsx',
    'DecisionContextModal.tsx',
]

# Order matters - more specific patterns first
REPLACEMENTS = [
    # Card wrapper pattern
    ('bg-[#121212] backdrop-blur border border-slate-800 rounded-2xl', 'rounded-2xl border border-gray-800 bg-white/[0.02]'),

    # Background hex colors
    ('bg-[#121212]', 'bg-gray-950'),
    ('bg-[#1a1a1a]', 'bg-gray-900'),
    ('bg-[#0a0f1c]', 'bg-gray-950'),
    ('bg-[#0a1020]', 'bg-gray-950'),
    ('bg-[#0F172A]', 'bg-gray-950'),

    # Hover bg-slate (specific patterns first)
    ('hover:bg-slate-800/50', 'hover:bg-white/[0.05]'),
    ('hover:bg-slate-700/30', 'hover:bg-white/[0.05]'),
    ('hover:bg-slate-800/30', 'hover:bg-white/[0.05]'),
    ('hover:bg-slate-800/20', 'hover:bg-white/[0.05]'),
    ('hover:bg-slate-700', 'hover:bg-gray-700'),
    ('hover:bg-slate-600', 'hover:bg-gray-600'),

    # Border slate (specific first)
    ('border-slate-800/50', 'border-gray-800'),
    ('border-slate-700/50', 'border-gray-800'),
    ('border-slate-800', 'border-gray-800'),
    ('border-slate-700', 'border-gray-700'),

    # Background slate (specific first)
    ('bg-slate-800/50', 'bg-white/[0.03]'),
    ('bg-slate-800/30', 'bg-white/[0.03]'),
    ('bg-slate-800/20', 'bg-white/[0.03]'),
    ('bg-slate-900/50', 'bg-gray-900'),
    ('bg-slate-800', 'bg-gray-800'),
    ('bg-slate-900', 'bg-gray-900'),
    ('bg-slate-700', 'bg-gray-700'),
    ('bg-slate-500/20', 'bg-gray-500/20'),

    # Text slate
    ('text-slate-600', 'text-gray-500'),
    ('text-slate-500', 'text-gray-500'),
    ('text-slate-400', 'text-gray-400'),
    ('text-slate-300', 'text-gray-300'),

    # Emerald -> success (specific first)
    ('border-emerald-500/30', 'border-success-500/20'),
    ('border-emerald-500/20', 'border-success-500/15'),
    ('bg-emerald-900/50', 'bg-success-500/5'),
    ('bg-emerald-900/40', 'bg-success-500/5'),
    ('bg-emerald-900/30', 'bg-success-500/5'),
    ('bg-emerald-900/20', 'bg-success-500/5'),
    ('bg-emerald-900/10', 'bg-success-500/5'),
    ('bg-emerald-800/20', 'bg-success-500/5'),
    ('bg-emerald-500/20', 'bg-success-500/10'),
    ('bg-emerald-500/10', 'bg-success-500/10'),
    ('bg-emerald-500', 'bg-success-500'),
    ('bg-emerald-600', 'bg-success-600'),
    ('hover:bg-emerald-500', 'hover:bg-success-400'),
    ('text-emerald-300', 'text-success-300'),
    ('text-emerald-400', 'text-success-400'),
    ('text-emerald-500', 'text-success-500'),

    # Red -> error (specific first)
    ('bg-red-500/20', 'bg-error-500/10'),
    ('bg-red-500/10', 'bg-error-500/10'),
    ('bg-red-900/50', 'bg-error-500/10'),
    ('bg-red-900/30', 'bg-error-500/10'),
    ('bg-red-600', 'bg-error-600'),
    ('bg-red-500', 'bg-error-500'),
    ('hover:bg-red-500', 'hover:bg-error-500'),
    ('text-red-400', 'text-error-400'),
    ('text-red-500', 'text-error-500'),

    # Amber/Yellow -> warning
    ('border-amber-500/30', 'border-warning-500/20'),
    ('bg-amber-500/10', 'bg-warning-500/5'),
    ('bg-amber-500/20', 'bg-warning-500/5'),
    ('bg-amber-500', 'bg-warning-500'),
    ('text-amber-400', 'text-warning-400'),
    ('text-yellow-400', 'text-warning-400'),

    # Purple -> brand (specific first)
    ('border-purple-500/30', 'border-brand-500/20'),
    ('border-purple-500/20', 'border-brand-500/20'),
    ('bg-purple-900/30', 'bg-brand-500/10'),
    ('bg-purple-900/20', 'bg-brand-500/10'),
    ('bg-purple-800/30', 'bg-brand-500/10'),
    ('bg-purple-500/20', 'bg-brand-500/10'),
    ('bg-purple-500/10', 'bg-brand-500/10'),
    ('bg-purple-600', 'bg-brand-600'),
    ('bg-purple-500', 'bg-brand-500'),
    ('hover:bg-purple-700', 'hover:bg-brand-600'),
    ('hover:bg-purple-500', 'hover:bg-brand-500'),
    ('text-purple-400', 'text-brand-400'),
    ('text-purple-500', 'text-brand-500'),
    ('text-purple-300', 'text-brand-300'),
    ('ring-purple-500', 'ring-brand-500'),
    ('focus:ring-purple-500', 'focus:ring-brand-500'),

    # Blue -> blue-light/brand
    ('text-blue-400', 'text-blue-light-400'),
    ('text-blue-300', 'text-blue-light-300'),
    ('bg-blue-500/20', 'bg-brand-500/10'),
    ('bg-blue-600', 'bg-brand-600'),
    ('bg-blue-500', 'bg-brand-500'),

    # Focus ring pattern
    ('focus:ring-2 focus:ring-brand-500', 'focus:outline-hidden focus:ring-3 focus:ring-brand-500/10'),

    # Remove font-inter
    (' font-inter', ''),
    ('font-inter ', ''),
    ('font-inter', ''),
]

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    for filename in FILES:
        filepath = os.path.join(COMPONENTS_DIR, filename)
        if os.path.exists(filepath):
            changed = process_file(filepath)
            print(f"{'UPDATED' if changed else 'NO CHANGES'}: {filename}")
        else:
            print(f"MISSING: {filename}")

if __name__ == '__main__':
    main()
