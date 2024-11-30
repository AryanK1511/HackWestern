import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import MetricFilters from "./MetricFilters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  className = "",
  isCollapsed = false,
  onToggle = () => {},
}: SidebarProps) {
  const [activeNav, setActiveNav] = useState("dashboard");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={`relative h-full bg-background border-r transition-all duration-300 ${className} ${isCollapsed ? "w-[60px]" : "w-[280px]"}`}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-6 z-10 rounded-full bg-primary text-primary-foreground shadow-md"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Sidebar Content */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-4 py-4">
            {/* Navigation */}
            <div className="px-3 py-2">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeNav === item.id ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isCollapsed ? "px-2" : "px-4"}`}
                    onClick={() => setActiveNav(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Theme Toggle */}
            <div className="px-3 py-2">
              <ThemeToggle />
            </div>

            {/* Metric Filters - Only show when expanded */}
            {!isCollapsed && (
              <div className="px-3 py-2">
                <MetricFilters />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
