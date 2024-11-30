"use client";

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface MetricData {
    timestamp: string;
    container_name: string;
    cpu_usage_percentage: number;
    memory_usage_mb: number;
    network_received_mb: number;
    network_sent_mb: number;
    disk_read_mb: number;
    disk_write_mb: number;
    runtime_seconds: number;
    code_execution_time_seconds: number;
}

export default function Home() {
    const [data, setData] = useState<MetricData[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<string>('code_execution_time_seconds');

    const metricOptions = [
        { value: 'code_execution_time_seconds', label: 'Completion Time' },
        { value: 'cpu_usage_percentage', label: 'CPU Usage' },
        { value: 'memory_usage_mb', label: 'Memory Usage' },
        { value: 'network_received_mb', label: 'Network Received' },
        { value: 'network_sent_mb', label: 'Network Sent' },
        { value: 'disk_read_mb', label: 'Disk Read' },
        { value: 'disk_write_mb', label: 'Disk Write' },
    ] as const;

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/testdata.csv');
                const csvText = await response.text();
                const result = Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                });
                const validData = result.data.filter((row: any) => row.timestamp !== null);
                setData(validData as MetricData[]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, []);

    const getBetterValue = (value: number): number => {
        return 100 - value;
    };

    const getBarPercentage = (distro: string): number => {
        const value = data.find(d => d.container_name === distro)?.[selectedMetric as keyof MetricData] || 0;
        const maxValue = Math.max(...data.map(d => Number(d[selectedMetric as keyof MetricData])));
        const minValue = Math.min(...data.map(d => Number(d[selectedMetric as keyof MetricData])));
        
        const percentage = ((Number(value) - minValue) / (maxValue - minValue)) * 100;
        
        return 100 - percentage;
    };

    const getMetricValue = (containerName: string): number => {
        const containerData = data.find(d => d.container_name === containerName);
        if (!containerData) return 0;
        const value = Number(containerData[selectedMetric as keyof MetricData]) || 0;
        return getBetterValue(value);
    };

    const getMetrics = (containerName: string) => {
        const containerData = data.find(d => d.container_name === containerName);
        if (!containerData) return { cpu: 0, memory: 0, completion: 0 };
        
        return {
            cpu: containerData.cpu_usage_percentage,
            memory: containerData.memory_usage_mb,
            completion: containerData.code_execution_time_seconds * 1000
        };
    };

    const ubuntuMetrics = getMetrics('Ubuntu20.04');
    const debianMetrics = getMetrics('Debian11');

    const sortedDistros = ['Ubuntu20.04', 'Debian11'].sort((a, b) => 
        getMetricValue(b) - getMetricValue(a)
    );

    const maxValue = Math.max(...sortedDistros.map(getMetricValue));

    const getMetricUnit = (metric: string): string => {
        if (metric.includes('percentage')) return '%';
        if (metric.includes('mb')) return 'MB';
        if (metric.includes('seconds')) return 's';
        return '';
    };

    console.log('Current Data:', data);
    console.log('Selected Metric:', selectedMetric);
    console.log('Metric Values:', sortedDistros.map(distro => ({
        distro,
        value: getMetricValue(distro),
        percentage: (getMetricValue(distro) / maxValue) * 100
    })));

    const getChartData = () => {
        const chartData = {
            labels: ['Ubuntu20.04', 'Debian11'],
            datasets: [
                {
                    label: metricOptions.find(m => m.value === selectedMetric)?.label || '',
                    data: ['Ubuntu20.04', 'Debian11'].map(distro => {
                        const value = data.find(d => d.container_name === distro)?.[selectedMetric as keyof MetricData] || 0;
                        return Number(value);
                    }),
                    backgroundColor: '#f97316', // orange-500
                    borderRadius: 6,
                }
            ]
        };
        return chartData;
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: getMetricUnit(selectedMetric)
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Distribution Comparison'
            }
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Chart Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Distribution Comparison</h2>
                    <select 
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="border rounded-md p-2"
                    >
                        {metricOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="h-[400px]">
                    {data.length > 0 && (
                        <Bar 
                            data={getChartData()} 
                            options={chartOptions}
                        />
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between text-white">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <div className="flex gap-4">
                    <span>Completion Time ⬆️</span>
                    <span>CPU Usage ⬆️</span>
                    <span>Memory Usage ⬆️</span>
                </div>
            </div>

            {/* OS Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ubuntu Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-[#E95420] rounded-lg p-2">
                            <span className="text-white font-bold">UB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Ubuntu 20.04</span>
                            <span className="bg-yellow-400 text-xs px-2 py-1 rounded-full">#1</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Completion Time</span>
                                <span>{ubuntuMetrics.completion.toFixed(1)}ms</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(ubuntuMetrics.completion / 100) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>CPU Usage</span>
                                <span>{ubuntuMetrics.cpu.toFixed(1)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${ubuntuMetrics.cpu}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Memory Usage</span>
                                <span>{ubuntuMetrics.memory.toFixed(1)}MB</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(ubuntuMetrics.memory / 100) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Debian Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-[#A81D33] rounded-lg p-2">
                            <span className="text-white font-bold">DEB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Debian 11</span>
                            <span className="bg-gray-200 text-xs px-2 py-1 rounded-full">#2</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Completion Time</span>
                                <span>{debianMetrics.completion.toFixed(1)}ms</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(debianMetrics.completion / 100) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>CPU Usage</span>
                                <span>{debianMetrics.cpu.toFixed(1)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${debianMetrics.cpu}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Memory Usage</span>
                                <span>{debianMetrics.memory.toFixed(1)}MB</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(debianMetrics.memory / 100) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty Card for Future OS */}
                <div className="bg-white rounded-lg p-6 shadow-sm opacity-50">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gray-400 rounded-lg p-2">
                            <span className="text-white font-bold">NEW</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Coming Soon</span>
                            <span className="bg-gray-200 text-xs px-2 py-1 rounded-full">#3</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Completion Time</span>
                                <span>--</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>CPU Usage</span>
                                <span>--</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Memory Usage</span>
                                <span>--</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics Section */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-white">Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall Completion Time */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Overall Completion Time</span>
                            <span>↗️</span>
                        </div>
                        <div className="mb-4">
                            <span className="text-2xl font-bold">{((ubuntuMetrics.completion + debianMetrics.completion) / 2).toFixed(1)}ms</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 mb-4">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                                <div key={day} className="text-center">
                                    <div className="bg-blue-900 w-2 h-16 mx-auto mb-2"></div>
                                    <span className="text-xs text-gray-600">{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CPU Usage Trend */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">CPU Usage Trend</span>
                            <span>📈</span>
                        </div>
                        <div className="mb-4">
                            <span className="text-2xl font-bold">{((ubuntuMetrics.cpu + debianMetrics.cpu) / 2).toFixed(1)}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 mb-4">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(ubuntuMetrics.cpu + debianMetrics.cpu) / 2}%` }}></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                                <div key={day} className="text-center">
                                    <div className="bg-blue-900 w-2 h-16 mx-auto mb-2"></div>
                                    <span className="text-xs text-gray-600">{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Memory Consumption */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Memory Consumption</span>
                            <span>📊</span>
                        </div>
                        <div className="mb-4">
                            <span className="text-2xl font-bold">{((ubuntuMetrics.memory + debianMetrics.memory) / 2).toFixed(1)}MB</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 mb-4">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((ubuntuMetrics.memory + debianMetrics.memory) / 2)}%` }}></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                                <div key={day} className="text-center">
                                    <div className="bg-blue-900 w-2 h-16 mx-auto mb-2"></div>
                                    <span className="text-xs text-gray-600">{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Trends */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-white">Performance Trends</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Average Completion Time */}
                    <div className="flex items-center gap-4 text-white">
                        <span>Average Completion Time</span>
                        <span className="text-green-500 text-sm">+5%</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((ubuntuMetrics.completion + debianMetrics.completion) / 2)}%` }}></div>
                        </div>
                    </div>

                    {/* Average CPU Usage */}
                    <div className="flex items-center gap-4 text-white">
                        <span>Average CPU Usage</span>
                        <span className="text-red-500 text-sm">-5%</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((ubuntuMetrics.cpu + debianMetrics.cpu) / 2)}%` }}></div>
                        </div>
                    </div>

                    {/* Average Memory Usage */}
                    <div className="flex items-center gap-4 text-white">
                        <span>Average Memory Usage</span>
                        <span className="text-red-500 text-sm">-5%</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((ubuntuMetrics.memory + debianMetrics.memory) / 2)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
