import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PerformanceIndicatorProps {
  value?: number;
  previousValue?: number;
  label?: string;
  showTrend?: boolean;
}

export default function PerformanceIndicator({
  value = 75,
  previousValue = 70,
  label = "Performance",
  showTrend = true,
}: PerformanceIndicatorProps) {
  const getTrendIcon = () => {
    if (value > previousValue)
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (value < previousValue)
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendLabel = () => {
    const diff = value - previousValue;
    if (diff > 0) return `+${diff}%`;
    if (diff < 0) return `${diff}%`;
    return "0%";
  };

  const getTrendColor = () => {
    if (value > previousValue)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (value < previousValue)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  };

  return (
    <div className="w-[280px] bg-background p-4 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {showTrend && (
          <Badge variant="secondary" className={getTrendColor()}>
            <span className="flex items-center gap-1">
              {getTrendIcon()}
              {getTrendLabel()}
            </span>
          </Badge>
        )}
      </div>
      <Progress value={value} className="h-2" />
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Current: {value}%</span>
        <span>Previous: {previousValue}%</span>
      </div>
    </div>
  );
}
