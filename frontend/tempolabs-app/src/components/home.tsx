import { useState } from "react";
import Sidebar from "./leaderboard/Sidebar";
import LeaderboardGrid from "./leaderboard/LeaderboardGrid";

function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <LeaderboardGrid />
      </div>
    </div>
  );
}

export default Home;
