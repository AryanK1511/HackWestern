'use client';

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
  Legend,
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// First, add this CSS animation at the top of your component
const loadingAnimation = `
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-5px); }
  }
`;

const Metrics: React.FC = () => {
  const [data, setData] = useState<MetricData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>(
    'code_execution_time_seconds'
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        console.log('Fetching data from CSV...');
        const response = await fetch('/testdata.csv');
        if (!response.ok) {
          throw new Error(
            `Failed to fetch CSV: ${response.status} ${response.statusText}`
          );
        }
        const csvText = await response.text();
        console.log('CSV data received:', csvText.slice(0, 200) + '...');

        const result = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
        });

        console.log('Parsed data:', {
          rowCount: result.data.length,
          fields: result.meta.fields,
          sample: result.data[0],
        });

        const validData = result.data.filter(
          (row: any) => row.timestamp !== null
        );
        setData(validData as MetricData[]);

        console.log('Valid data loaded:', {
          rowCount: validData.length,
          sample: validData[0],
        });
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
    const value =
      data.find((d) => d.container_name === distro)?.[
        selectedMetric as keyof MetricData
      ] || 0;
    const maxValue = Math.max(
      ...data.map((d) => Number(d[selectedMetric as keyof MetricData]))
    );
    const minValue = Math.min(
      ...data.map((d) => Number(d[selectedMetric as keyof MetricData]))
    );

    const percentage =
      ((Number(value) - minValue) / (maxValue - minValue)) * 100;

    return 100 - percentage;
  };

  const getMetricValue = (containerName: string): number => {
    const containerData = data.find((d) => d.container_name === containerName);
    if (!containerData) return 0;
    const value =
      Number(containerData[selectedMetric as keyof MetricData]) || 0;
    return getBetterValue(value);
  };

  const getMetrics = (containerName: string) => {
    const containerData = data.find((d) => d.container_name === containerName);
    if (!containerData) return { cpu: 0, memory: 0, completion: 0 };

    return {
      cpu: containerData.cpu_usage_percentage,
      memory: containerData.memory_usage_mb,
      completion: containerData.code_execution_time_seconds * 1000,
    };
  };

  const ubuntuMetrics = getMetrics('Ubuntu20.04');
  const debianMetrics = getMetrics('Debian11');

  const sortedDistros = ['Ubuntu20.04', 'Debian11'].sort(
    (a, b) => getMetricValue(b) - getMetricValue(a)
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
  console.log(
    'Metric Values:',
    sortedDistros.map((distro) => ({
      distro,
      value: getMetricValue(distro),
      percentage: (getMetricValue(distro) / maxValue) * 100,
    }))
  );

  const getChartData = () => {
    const chartData = {
      labels: ['Ubuntu20.04', 'Debian11'],
      datasets: [
        {
          label:
            metricOptions.find((m) => m.value === selectedMetric)?.label || '',
          data: ['Ubuntu20.04', 'Debian11'].map((distro) => {
            const value =
              data.find((d) => d.container_name === distro)?.[
                selectedMetric as keyof MetricData
              ] || 0;
            return Number(value);
          }),
          backgroundColor: '#f97316', // orange-500
          borderRadius: 6,
        },
      ],
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
          text: getMetricUnit(selectedMetric),
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution Comparison',
      },
    },
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    const userMessage = { role: 'user' as const, content: newMessage };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');

    try {
      // Check if data exists and has at least one row
      if (!data || !data.length || !data[0]) {
        console.error('Data check failed:', { data });
        throw new Error('No data available to analyze');
      }

      // Convert data to CSV string with headers
      const headers = [
        'timestamp',
        'container_name',
        'cpu_usage_percentage',
        'memory_usage_mb',
        'network_received_mb',
        'network_sent_mb',
        'disk_read_mb',
        'disk_write_mb',
        'runtime_seconds',
        'code_execution_time_seconds',
      ].join(',');

      const rows = data.map((row) =>
        [
          row.timestamp,
          row.container_name,
          row.cpu_usage_percentage,
          row.memory_usage_mb,
          row.network_received_mb,
          row.network_sent_mb,
          row.disk_read_mb,
          row.disk_write_mb,
          row.runtime_seconds,
          row.code_execution_time_seconds,
        ]
          .map((value) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string')
              return `"${value.replace(/"/g, '""')}"`;
            return value.toString();
          })
          .join(',')
      );

      const csvData = [headers, ...rows].join('\n');

      console.log('Sending request to /api/chat with:', {
        messageLength: newMessage.length,
        message: newMessage,
        csvLength: csvData.length,
        csvPreview: csvData.slice(0, 200),
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          csv_data: csvData,
        }),
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText,
        });
        throw new Error(`Server error: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }

      if (!result || !result.response) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response from server');
      }

      console.log('Successful response:', result);

      const assistantMessage = {
        role: 'assistant' as const,
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${
            error instanceof Error ? error.message : 'Failed to process request'
          }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{loadingAnimation}</style>
      <div className='container mx-auto p-6 space-y-8'>
        <div className='bg-white rounded-lg p-6 shadow-sm mb-8'>
          <h2 className='text-xl font-bold mb-6'>Distribution Comparison</h2>
          <div className='flex justify-center mb-6'>
            <div className='inline-flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg'>
              {metricOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMetric(option.value)}
                  className={`
                                        flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all min-w-[120px]
                                        ${
                                          selectedMetric === option.value
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }
                                    `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className='h-[400px]'>
            {data.length > 0 && (
              <Bar data={getChartData()} options={chartOptions} />
            )}
          </div>
        </div>
        <div className='bg-white rounded-lg p-6 shadow-sm mb-8'>
          <h2 className='text-xl font-bold mb-6'>Ask about the Data</h2>
          <div className='mb-4 h-64 overflow-y-auto space-y-4 border rounded-lg p-4'>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className='flex justify-start'>
                <div className='bg-gray-100 rounded-lg px-4 py-2 text-gray-900 flex items-center'>
                  Thinking
                  <span className='inline-flex ml-2'>
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className='w-1.5 h-1.5 bg-gray-600 rounded-full mx-0.5'
                        style={{
                          animation: 'bounce 1.4s infinite ease-in-out',
                          animationDelay: `${dot * 0.16}s`,
                        }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className='flex gap-2'>
            <input
              type='text'
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder='Ask a question about the performance data...'
              className='flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 
                                bg-gray-700 text-white placeholder-gray-400 border-gray-600'
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50'
            >
              Send
            </button>
          </div>
        </div>
        <div className='flex items-center justify-between text-white'>
          <h1 className='text-2xl font-bold'>Analytics</h1>
          <div className='flex gap-4'>
            <span>Completion Time ⬆️</span>
            <span>CPU Usage ⬆️</span>
            <span>Memory Usage ⬆️</span>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='bg-[#E95420] rounded-lg p-2'>
                <span className='text-white font-bold'>UB</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-bold'>Ubuntu 20.04</span>
                <span className='bg-yellow-400 text-xs px-2 py-1 rounded-full'>
                  #1
                </span>
              </div>
            </div>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>Completion Time</span>
                  <span>{ubuntuMetrics.completion.toFixed(1)}ms</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{
                      width: `${(ubuntuMetrics.completion / 100) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>CPU Usage</span>
                  <span>{ubuntuMetrics.cpu.toFixed(1)}%</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{ width: `${ubuntuMetrics.cpu}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>Memory Usage</span>
                  <span>{ubuntuMetrics.memory.toFixed(1)}MB</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{ width: `${(ubuntuMetrics.memory / 100) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-lg p-6 shadow-sm'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='bg-[#A81D33] rounded-lg p-2'>
                <span className='text-white font-bold'>DEB</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-bold'>Debian 11</span>
                <span className='bg-gray-200 text-xs px-2 py-1 rounded-full'>
                  #2
                </span>
              </div>
            </div>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>Completion Time</span>
                  <span>{debianMetrics.completion.toFixed(1)}ms</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{
                      width: `${(debianMetrics.completion / 100) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>CPU Usage</span>
                  <span>{debianMetrics.cpu.toFixed(1)}%</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{ width: `${debianMetrics.cpu}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>Memory Usage</span>
                  <span>{debianMetrics.memory.toFixed(1)}MB</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{ width: `${(debianMetrics.memory / 100) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-lg p-6 shadow-sm opacity-50'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='bg-gray-400 rounded-lg p-2'>
                <span className='text-white font-bold'>NEW</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-bold'>Coming Soon</span>
                <span className='bg-gray-200 text-xs px-2 py-1 rounded-full'>
                  #3
                </span>
              </div>
            </div>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>Completion Time</span>
                  <span>--</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div className='bg-gray-400 h-2 rounded-full w-0'></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>CPU Usage</span>
                  <span>--</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div className='bg-gray-400 h-2 rounded-full w-0'></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span>Memory Usage</span>
                  <span>--</span>
                </div>
                <div className='bg-gray-200 rounded-full h-2'>
                  <div className='bg-gray-400 h-2 rounded-full w-0'></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className='text-xl font-bold mb-6 text-white'>
            Performance Metrics
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Overall Completion Time */}
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-4'>
                <span className='font-semibold'>Overall Completion Time</span>
                <span>↗️</span>
              </div>
              <div className='mb-4'>
                <span className='text-2xl font-bold'>
                  {(
                    (ubuntuMetrics.completion + debianMetrics.completion) /
                    2
                  ).toFixed(1)}
                  ms
                </span>
              </div>
              <div className='bg-gray-200 rounded-full h-2 mb-4'>
                <div
                  className='bg-blue-600 h-2 rounded-full'
                  style={{ width: '85%' }}
                ></div>
              </div>
              <div className='grid grid-cols-5 gap-2'>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className='text-center'>
                    <div className='bg-blue-900 w-2 h-16 mx-auto mb-2'></div>
                    <span className='text-xs text-gray-600'>{day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-4'>
                <span className='font-semibold'>CPU Usage Trend</span>
                <span>📈</span>
              </div>
              <div className='mb-4'>
                <span className='text-2xl font-bold'>
                  {((ubuntuMetrics.cpu + debianMetrics.cpu) / 2).toFixed(1)}%
                </span>
              </div>
              <div className='bg-gray-200 rounded-full h-2 mb-4'>
                <div
                  className='bg-blue-600 h-2 rounded-full'
                  style={{
                    width: `${(ubuntuMetrics.cpu + debianMetrics.cpu) / 2}%`,
                  }}
                ></div>
              </div>
              <div className='grid grid-cols-5 gap-2'>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className='text-center'>
                    <div className='bg-blue-900 w-2 h-16 mx-auto mb-2'></div>
                    <span className='text-xs text-gray-600'>{day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='bg-white rounded-lg p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-4'>
                <span className='font-semibold'>Memory Consumption</span>
                <span>📊</span>
              </div>
              <div className='mb-4'>
                <span className='text-2xl font-bold'>
                  {((ubuntuMetrics.memory + debianMetrics.memory) / 2).toFixed(
                    1
                  )}
                  MB
                </span>
              </div>
              <div className='bg-gray-200 rounded-full h-2 mb-4'>
                <div
                  className='bg-blue-600 h-2 rounded-full'
                  style={{
                    width: `${
                      (ubuntuMetrics.memory + debianMetrics.memory) / 2
                    }%`,
                  }}
                ></div>
              </div>
              <div className='grid grid-cols-5 gap-2'>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className='text-center'>
                    <div className='bg-blue-900 w-2 h-16 mx-auto mb-2'></div>
                    <span className='text-xs text-gray-600'>{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className='text-xl font-bold mb-6 text-white'>
            Performance Trends
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='flex items-center gap-4 text-white'>
              <span>Average Completion Time</span>
              <span className='text-green-500 text-sm'>+5%</span>
              <div className='flex-1 bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full'
                  style={{
                    width: `${
                      (ubuntuMetrics.completion + debianMetrics.completion) / 2
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className='flex items-center gap-4 text-white'>
              <span>Average CPU Usage</span>
              <span className='text-red-500 text-sm'>-5%</span>
              <div className='flex-1 bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full'
                  style={{
                    width: `${(ubuntuMetrics.cpu + debianMetrics.cpu) / 2}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className='flex items-center gap-4 text-white'>
              <span>Average Memory Usage</span>
              <span className='text-red-500 text-sm'>-5%</span>
              <div className='flex-1 bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full'
                  style={{
                    width: `${
                      (ubuntuMetrics.memory + debianMetrics.memory) / 2
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Metrics;
