import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Cpu, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OSCardProps {
  osName?: string;
  osLogo?: string;
  metrics?: {
    completionTime?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    rank?: number;
  };
}

export default function OSCard({
  osName = "Ubuntu 22.04",
  osLogo = "https://dummyimage.com/64/000000/ffffff&text=OS",
  metrics = {
    completionTime: 85,
    cpuUsage: 65,
    memoryUsage: 45,
    rank: 1,
  },
}: OSCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-gray-400";
    if (rank === 3) return "bg-amber-600";
    return "bg-slate-600";
  };

  return (
    <Card className="w-[300px] bg-background hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={osLogo}
              alt={osName}
              className="w-12 h-12 rounded-lg object-contain"
            />
            <CardTitle className="text-xl">{osName}</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className={`${getRankColor(metrics.rank)} text-white`}
          >
            <Trophy className="w-3 h-3 mr-1" />#{metrics.rank}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completion Time */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Completion Time
            </span>
            <span className="text-sm">{metrics.completionTime}ms</span>
          </div>
          <Progress value={metrics.completionTime} className="h-2" />
        </div>

        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              CPU Usage
            </span>
            <span className="text-sm">{metrics.cpuUsage}%</span>
          </div>
          <Progress value={metrics.cpuUsage} className="h-2" />
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Memory Usage
            </span>
            <span className="text-sm">{metrics.memoryUsage}%</span>
          </div>
          <Progress value={metrics.memoryUsage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
