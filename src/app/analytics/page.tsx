"use client";

import { useState, useEffect } from "react";
import Web3Provider from "@/components/Web3Provider";
import { motion } from "framer-motion";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { analytics } from "@/utils/analytics";
import ActionButton from "@/components/shared/ActionButton";
import { useAppNavigation } from "@/hooks/useAppNavigation";

function AnalyticsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("24h");

  // Use shared navigation hook
  const { goHome } = useAppNavigation();

  // Simple password protection for admin features
  const handleAuth = () => {
    // In production, use proper authentication
    if (
      password === "lub-admin-2024" ||
      process.env.NODE_ENV === "development"
    ) {
      setIsAuthorized(true);
    } else {
      alert("Invalid password");
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadRecentEvents();
    }
  }, [isAuthorized, timeRange]);

  const loadRecentEvents = () => {
    const now = new Date();
    const hoursAgo = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 1;
    const startDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const events = analytics.getEventsInRange(startDate, now);
    setRecentEvents(events.slice(-50)); // Last 50 events
  };

  const exportData = () => {
    const data = {
      summary: analytics.getAnalyticsSummary(),
      recentEvents: recentEvents,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lub-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        {/* Navigation Header */}
        <div className="absolute top-4 left-4">
          <ActionButton
            onClick={() => goHome()}
            variant="ghost"
            size="sm"
            icon="←"
          >
            Back to App
          </ActionButton>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🔐 Analytics Dashboard
          </h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAuth()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              Access Dashboard
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Admin access required for detailed analytics
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header */}
        <div className="mb-4">
          <ActionButton
            onClick={() => goHome()}
            variant="ghost"
            size="sm"
            icon="←"
          >
            Back to App
          </ActionButton>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Lub Match Analytics
            </h1>
            <div className="flex gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300"
              >
                📥 Export Data
              </button>
            </div>
          </div>

          {/* Main Analytics Dashboard */}
          <AnalyticsDashboard isAdmin={true} />
        </motion.div>

        {/* Recent Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🕒 Recent Events ({recentEvents.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">
                    Time
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">
                    Event
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">
                    Session
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(
                          event.type
                        )}`}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">
                      {event.sessionId.slice(-8)}
                    </td>
                    <td className="py-2 px-3 text-gray-600 max-w-xs truncate">
                      {JSON.stringify(event.data)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No events found in the selected time range
            </div>
          )}
        </motion.div>

        {/* Event Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {getEventTypeBreakdown(recentEvents).map(
            ({ type, count, percentage }) => (
              <div key={type} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-800 mb-2">{type}</h3>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {count}
                </div>
                <div className="text-sm text-gray-500">
                  {percentage.toFixed(1)}% of events
                </div>
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    lub_created: "bg-green-100 text-green-800",
    game_complete: "bg-blue-100 text-blue-800",
    game_shared: "bg-purple-100 text-purple-800",
    wallet_connected: "bg-yellow-100 text-yellow-800",
    nft_minted: "bg-pink-100 text-pink-800",
    social_game: "bg-indigo-100 text-indigo-800",
    page_view: "bg-gray-100 text-gray-800",
  };
  return colors[eventType] || "bg-gray-100 text-gray-800";
}

function getEventTypeBreakdown(
  events: any[]
): Array<{ type: string; count: number; percentage: number }> {
  const counts: Record<string, number> = {};
  events.forEach((event) => {
    counts[event.type] = (counts[event.type] || 0) + 1;
  });

  const total = events.length;
  return Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// Export the page with Web3Provider wrapper and disable SSR
export default function AnalyticsPageWrapper() {
  return (
    <Web3Provider>
      <AnalyticsPage />
    </Web3Provider>
  );
}
