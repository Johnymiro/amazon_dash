'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as echarts from 'echarts';
import { API_BASE } from '@/utils/api';

// Shadow Blue for simulations
const SHADOW_BLUE = '#778BA5';

// Fetch inventory data for real DoS and L_eff
async function fetchInventory(asin: string = 'B08TEST001') {
    const res = await fetch(`${API_BASE}/inventory/${asin}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
}

// Historical inventory data for simulation (will be replaced by real data in future)
const historicalData = [
    { day: 1, dos: 28 }, { day: 2, dos: 26 }, { day: 3, dos: 24 }, { day: 4, dos: 22 },
    { day: 5, dos: 20 }, { day: 6, dos: 18 }, { day: 7, dos: 17 }, { day: 8, dos: 16 },
    { day: 9, dos: 15 }, { day: 10, dos: 14 }, { day: 11, dos: 16 }, { day: 12, dos: 18 },
    { day: 13, dos: 21 }, { day: 14, dos: 23 }
];

export default function SigmoidEditor() {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    // Fetch real inventory data
    const { data: inventoryData } = useQuery({
        queryKey: ['inventory', 'B08TEST001'],
        queryFn: () => fetchInventory('B08TEST001'),
        refetchInterval: 120000, // Refresh every 2 min
        retry: 2,
    });

    // Live values - initialize from API when available
    const [dos, setDos] = useState(21);
    const [leff, setLeff] = useState(14);
    const [k, setK] = useState(0.5);
    const [multiplier, setMultiplier] = useState(0.85);
    const [initialized, setInitialized] = useState(false);

    // Simulation mode
    const [simulationMode, setSimulationMode] = useState(false);
    const [simK, setSimK] = useState(0.5);
    const [simLeff, setSimLeff] = useState(14);
    const [projectedAlphaImpact, setProjectedAlphaImpact] = useState(0);

    // Update DoS and L_eff when real data arrives
    useEffect(() => {
        if (inventoryData?.inventory && !initialized) {
            const inv = inventoryData.inventory;
            if (inv.days_of_supply) setDos(Math.round(inv.days_of_supply));
            if (inv.lead_time_days) setLeff(inv.lead_time_days);
            setInitialized(true);
        }
    }, [inventoryData, initialized]);

    useEffect(() => {
        if (!chartRef.current) return;

        chartInstance.current = echarts.init(chartRef.current);

        const handleResize = () => chartInstance.current?.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
        };
    }, []);

    // Calculate sigmoid function
    const sigmoid = (x: number, kVal: number, leffVal: number) => {
        return 1 / (1 + Math.exp(-kVal * (x - leffVal)));
    };

    // Calculate projected Alpha impact from simulation
    useEffect(() => {
        if (!simulationMode) {
            setProjectedAlphaImpact(0);
            return;
        }

        // Calculate average M_supply difference over historical data
        let totalDiff = 0;
        historicalData.forEach(d => {
            const liveM = sigmoid(d.dos, k, leff);
            const simM = sigmoid(d.dos, simK, simLeff);
            totalDiff += (simM - liveM);
        });

        // Convert to projected profit impact (simplified model)
        const avgDiff = totalDiff / historicalData.length;
        const projectedImpact = avgDiff * 1245.50; // Revenue affected per M_supply point
        setProjectedAlphaImpact(projectedImpact);
    }, [simulationMode, simK, simLeff, k, leff]);

    useEffect(() => {
        if (!chartInstance.current) return;

        // Generate live curve data
        const liveData: [number, number][] = [];
        for (let x = 0; x <= 60; x++) {
            liveData.push([x, sigmoid(x, k, leff)]);
        }

        // Generate simulated curve data
        const simData: [number, number][] = [];
        if (simulationMode) {
            for (let x = 0; x <= 60; x++) {
                simData.push([x, sigmoid(x, simK, simLeff)]);
            }
        }

        // Historical data points
        const histLivePoints = historicalData.map(d => [d.dos, sigmoid(d.dos, k, leff)]);
        const histSimPoints = simulationMode ? historicalData.map(d => [d.dos, sigmoid(d.dos, simK, simLeff)]) : [];

        const currentY = sigmoid(dos, k, leff);
        setMultiplier(currentY);

        const series: echarts.SeriesOption[] = [
            // Live curve
            {
                name: 'Live Curve',
                type: 'line',
                data: liveData,
                smooth: true,
                lineStyle: { color: '#8B5CF6', width: 3 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                        { offset: 1, color: 'rgba(139, 92, 246, 0)' }
                    ])
                },
                symbol: 'none',
                z: 2
            },
            // L_eff marker (live)
            {
                type: 'scatter',
                data: [[leff, 0.5]],
                symbolSize: 12,
                itemStyle: { color: '#F59E0B' },
                label: { show: true, formatter: 'L_eff', position: 'top', color: '#F59E0B', fontFamily: 'JetBrains Mono' },
                z: 3
            },
            // Current position
            {
                type: 'scatter',
                data: [[dos, currentY]],
                symbolSize: 16,
                itemStyle: { color: '#10B981', shadowBlur: 10, shadowColor: '#10B981' },
                label: { show: true, formatter: currentY.toFixed(2), position: 'top', color: '#10B981', fontFamily: 'JetBrains Mono' },
                z: 4
            }
        ];

        // Add simulation series if in simulation mode
        if (simulationMode) {
            series.push(
                // Simulated curve (ghosted)
                {
                    name: 'Simulated Curve',
                    type: 'line',
                    data: simData,
                    smooth: true,
                    lineStyle: { color: SHADOW_BLUE, width: 3, type: 'dashed' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(119, 139, 165, 0.2)' },
                            { offset: 1, color: 'rgba(119, 139, 165, 0)' }
                        ])
                    },
                    symbol: 'none',
                    z: 1
                },
                // Simulated L_eff marker
                {
                    type: 'scatter',
                    data: [[simLeff, 0.5]],
                    symbolSize: 10,
                    itemStyle: { color: SHADOW_BLUE, opacity: 0.8 },
                    label: { show: true, formatter: 'Sim L_eff', position: 'bottom', color: SHADOW_BLUE, fontFamily: 'JetBrains Mono', fontSize: 10 },
                    z: 2
                },
                // Historical points on live curve
                {
                    name: 'Historical (Live)',
                    type: 'scatter',
                    data: histLivePoints,
                    symbolSize: 6,
                    itemStyle: { color: '#8B5CF6' },
                    z: 3
                },
                // Historical points on simulated curve
                {
                    name: 'Historical (Simulated)',
                    type: 'scatter',
                    data: histSimPoints,
                    symbolSize: 6,
                    itemStyle: { color: SHADOW_BLUE },
                    z: 2
                }
            );
        }

        chartInstance.current.setOption({
            backgroundColor: 'transparent',
            grid: { top: 30, right: 20, bottom: 40, left: 60 },
            legend: simulationMode ? {
                show: true,
                top: 0,
                right: 0,
                textStyle: { color: '#94a3b8', fontFamily: 'JetBrains Mono', fontSize: 10 },
                data: ['Live Curve', 'Simulated Curve']
            } : undefined,
            xAxis: {
                type: 'value',
                min: 0,
                max: 60,
                name: 'DoS (Days of Supply)',
                nameLocation: 'middle',
                nameGap: 25,
                nameTextStyle: { color: '#64748b', fontFamily: 'JetBrains Mono', fontSize: 10 },
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#64748b', fontFamily: 'JetBrains Mono', fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 1,
                name: 'M_supply',
                nameTextStyle: { color: '#64748b', fontFamily: 'JetBrains Mono', fontSize: 10 },
                axisLine: { show: false },
                splitLine: { lineStyle: { color: '#1e293b' } },
                axisLabel: { color: '#64748b', fontFamily: 'JetBrains Mono', fontSize: 10 }
            },
            series
        });
    }, [dos, leff, k, simulationMode, simK, simLeff]);

    return (
        <section className="bg-gray-50 dark:bg-gray-950 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>📈</span> Supply Chain Throttle (M<sub>supply</sub>)
                </h3>

                {/* Simulation Mode Toggle */}
                <button
                    onClick={() => setSimulationMode(!simulationMode)}
                    className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                        ${simulationMode
                            ? `bg-[${SHADOW_BLUE}]/20 border border-[${SHADOW_BLUE}] text-[${SHADOW_BLUE}]`
                            : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }
                    `}
                    style={simulationMode ? { backgroundColor: 'rgba(119, 139, 165, 0.2)', borderColor: SHADOW_BLUE, color: SHADOW_BLUE } : undefined}
                >
                    {simulationMode ? '🔬 Simulation ON' : '🔬 What-If Mode'}
                </button>
            </div>

            {/* Projected Alpha Impact (only in simulation mode) */}
            {simulationMode && (
                <div
                    className="mb-4 p-3 rounded-lg border flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(119, 139, 165, 0.1)', borderColor: SHADOW_BLUE }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm" style={{ color: SHADOW_BLUE }}>Projected Alpha Impact (14-day simulation)</span>
                    </div>
                    <div
                        className="text-xl font-bold font-mono"
                        style={{ color: projectedAlphaImpact >= 0 ? '#00FF9F' : '#EF4444', fontFamily: 'JetBrains Mono' }}
                    >
                        {projectedAlphaImpact >= 0 ? '+' : ''}{projectedAlphaImpact.toFixed(2)}
                        <span className="text-xs ml-1 opacity-70">USD</span>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div ref={chartRef} style={{ height: '220px' }} />

            {/* Controls Grid */}
            <div className={`grid gap-4 mt-4 ${simulationMode ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {/* Live Controls */}
                <div className={simulationMode ? 'opacity-60' : ''}>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">LIVE VALUES</div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Days of Supply (DoS)</label>
                            <input
                                type="range"
                                min="0"
                                max="60"
                                value={dos}
                                onChange={(e) => setDos(parseInt(e.target.value))}
                                className="w-full accent-emerald-500"
                            />
                            <div className="text-right text-success-400 font-mono text-sm" style={{ fontFamily: 'JetBrains Mono' }}>{dos} days</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Lead Time (L<sub>eff</sub>)</label>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={leff}
                                onChange={(e) => setLeff(parseInt(e.target.value))}
                                className="w-full accent-purple-500"
                            />
                            <div className="text-right text-brand-400 font-mono text-sm" style={{ fontFamily: 'JetBrains Mono' }}>{leff} days</div>
                        </div>
                    </div>
                </div>

                {/* Simulation Controls (only when simulation mode is on) */}
                {simulationMode && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(119, 139, 165, 0.1)' }}>
                        <div className="text-xs mb-2" style={{ color: SHADOW_BLUE }}>SIMULATION PARAMETERS</div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs block mb-1" style={{ color: SHADOW_BLUE }}>
                                    Braking Force (k) <span className="opacity-60">Risk Profile</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.5"
                                    step="0.1"
                                    value={simK}
                                    onChange={(e) => setSimK(parseFloat(e.target.value))}
                                    className="w-full"
                                    style={{ accentColor: SHADOW_BLUE }}
                                />
                                <div className="text-right font-mono text-sm" style={{ color: SHADOW_BLUE, fontFamily: 'JetBrains Mono' }}>k = {simK.toFixed(1)}</div>
                            </div>
                            <div>
                                <label className="text-xs block mb-1" style={{ color: SHADOW_BLUE }}>
                                    Simulated L<sub>eff</sub>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={simLeff}
                                    onChange={(e) => setSimLeff(parseInt(e.target.value))}
                                    className="w-full"
                                    style={{ accentColor: SHADOW_BLUE }}
                                />
                                <div className="text-right font-mono text-sm" style={{ color: SHADOW_BLUE, fontFamily: 'JetBrains Mono' }}>{simLeff} days</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Current Multiplier Display */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Current M<sub>supply</sub></div>
                    <div
                        className={`text-2xl font-bold font-mono ${multiplier > 0.7 ? 'text-success-400' : multiplier > 0.3 ? 'text-warning-400' : 'text-error-400'}`}
                        style={{ fontFamily: 'JetBrains Mono' }}
                    >
                        {multiplier.toFixed(3)}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono" style={{ fontFamily: 'JetBrains Mono' }}>
                        M = 1 / (1 + e<sup>-k(DoS - L<sub>eff</sub>)</sup>)
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {multiplier > 0.7 ? '✅ Full throttle' : multiplier > 0.3 ? '⚠️ Caution zone' : '🚨 Rationing'}
                    </div>
                </div>
            </div>
        </section>
    );
}
