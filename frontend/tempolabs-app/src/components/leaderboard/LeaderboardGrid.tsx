import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import OSCard from "./OSCard";
import MetricChart from "./MetricChart";
import PerformanceIndicator from "./PerformanceIndicator";

interface LeaderboardGridProps {
  operatingSystems?: {
    osName: string;
    osLogo: string;
    metrics: {
      completionTime: number;
      cpuUsage: number;
      memoryUsage: number;
      rank: number;
    };
  }[];
  onSort?: (metric: string) => void;
}

export default function LeaderboardGrid({
  operatingSystems = [
    {
      osName: "Ubuntu 22.04",
      osLogo: "https://dummyimage.com/64/FF4B12/ffffff&text=UB",
      metrics: {
        completionTime: 85,
        cpuUsage: 65,
        memoryUsage: 45,
        rank: 1,
      },
    },
    {
      osName: "Windows 11",
      osLogo: "https://dummyimage.com/64/00A4EF/ffffff&text=WIN",
      metrics: {
        completionTime: 80,
        cpuUsage: 70,
        memoryUsage: 55,
        rank: 2,
      },
    },
    {
      osName: "macOS Sonoma",
      osLogo: "https://dummyimage.com/64/999999/ffffff&text=MAC",
      metrics: {
        completionTime: 75,
        cpuUsage: 60,
        memoryUsage: 50,
        rank: 3,
      },
    },
  ],
  onSort = () => {},
}: LeaderboardGridProps) {
  const [activeMetric, setActiveMetric] = useState("completionTime");

  const metrics = [
    { id: "completionTime", label: "Completion Time" },
    { id: "cpuUsage", label: "CPU Usage" },
    { id: "memoryUsage", label: "Memory Usage" },
  ];

  return (
    <div className="h-full bg-background p-6 overflow-hidden">
      {/* Header with sort buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">OS Performance Leaderboard</h2>
        <div className="flex gap-2">
          {metrics.map((metric) => (
            <Button
              key={metric.id}
              variant={activeMetric === metric.id ? "secondary" : "ghost"}
              onClick={() => {
                setActiveMetric(metric.id);
                onSort(metric.id);
              }}
              className="flex items-center gap-1"
            >
              {metric.label}
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="space-y-8">
          {/* OS Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {operatingSystems.map((os, index) => (
              <OSCard
                key={index}
                osName={os.osName}
                osLogo={os.osLogo}
                metrics={os.metrics}
              />
            ))}
          </div>

          {/* Performance Metrics Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MetricChart
                title="Overall Completion Time"
                value={85}
                chartType="line"
              />
              <MetricChart title="CPU Usage Trend" value={70} chartType="bar" />
              <MetricChart
                title="Memory Consumption"
                value={60}
                chartType="activity"
              />
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Performance Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <PerformanceIndicator
                label="Average Completion Time"
                value={85}
                previousValue={80}
              />
              <PerformanceIndicator
                label="Average CPU Usage"
                value={65}
                previousValue={70}
              />
              <PerformanceIndicator
                label="Average Memory Usage"
                value={50}
                previousValue={55}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
