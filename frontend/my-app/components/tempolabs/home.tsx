"use client";

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

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

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/testdata.csv');
                const csvText = await response.text();
                const result = Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                });
                setData(result.data as MetricData[]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, []);

    // Calculate averages and metrics
    const getMetrics = (containerName: string) => {
        const containerData = data.find(d => d.container_name === containerName);
        if (!containerData) return { cpu: 0, memory: 0, completion: 0 };
        
        return {
            cpu: containerData.cpu_usage_percentage,
            memory: containerData.memory_usage_mb,
            completion: containerData.code_execution_time_seconds * 1000 // Convert to ms
        };
    };

    const ubuntuMetrics = getMetrics('Ubuntu20.04');
    const debianMetrics = getMetrics('Debian11');

    return (
        <div className="container mx-auto p-6 space-y-8">
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
