import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, BarChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetricChartProps {
  title?: string;
  value?: number;
  maxValue?: number;
  chartType?: "line" | "bar" | "activity";
  data?: { value: number; label: string }[];
}

export default function MetricChart({
  title = "Performance Metric",
  value = 75,
  maxValue = 100,
  chartType = "line",
  data = [
    { value: 65, label: "Mon" },
    { value: 75, label: "Tue" },
    { value: 70, label: "Wed" },
    { value: 85, label: "Thu" },
    { value: 80, label: "Fri" },
  ],
}: MetricChartProps) {
  const getChartIcon = () => {
    switch (chartType) {
      case "line":
        return <LineChart className="h-4 w-4" />;
      case "bar":
        return <BarChart className="h-4 w-4" />;
      case "activity":
        return <Activity className="h-4 w-4" />;
      default:
        return <LineChart className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-[280px] bg-background hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button variant="ghost" size="icon">
          {getChartIcon()}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}%</div>
        <Progress value={(value / maxValue) * 100} className="h-2 mt-2" />
        <div className="mt-4 h-[60px] w-full">
          <div className="flex h-full items-end justify-between gap-2">
            {data.map((item, index) => (
              <div key={index} className="relative flex flex-col items-center">
                <div
                  className="w-2 bg-primary rounded-full transition-all"
                  style={{
                    height: `${(item.value / maxValue) * 60}px`,
                  }}
                />
                <span className="mt-1 text-xs text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
