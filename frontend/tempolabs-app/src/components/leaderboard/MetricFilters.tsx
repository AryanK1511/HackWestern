import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MetricFiltersProps {
  metrics?: {
    id: string;
    name: string;
    checked: boolean;
  }[];
  onMetricToggle?: (metricId: string, checked: boolean) => void;
}

export default function MetricFilters({
  metrics = [
    { id: "completion-time", name: "Completion Time", checked: true },
    { id: "cpu-usage", name: "CPU Usage", checked: true },
    { id: "memory-usage", name: "Memory Usage", checked: true },
    { id: "disk-io", name: "Disk I/O", checked: false },
    { id: "network-usage", name: "Network Usage", checked: false },
  ],
  onMetricToggle = () => {},
}: MetricFiltersProps) {
  return (
    <div className="bg-background p-4 rounded-lg w-full">
      <h3 className="text-lg font-semibold mb-4">Metrics</h3>
      <ScrollArea className="h-[160px] pr-4">
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="flex items-center space-x-2">
              <Checkbox
                id={metric.id}
                checked={metric.checked}
                onCheckedChange={(checked) =>
                  onMetricToggle(metric.id, checked as boolean)
                }
              />
              <Label
                htmlFor={metric.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {metric.name}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
