"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Calendar,
  Users,
  Video,
  Mic,
  Loader2,
  Timer,
  Activity,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

interface Participant {
  id: string;
  name: string;
  email: string | null;
  isHost: boolean;
  joinedAt: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  maxParticipants: number;
  status: string;
  hostId: string;
  inviteCode: string;
  enableRecording: boolean;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  scheduled: number;
  totalParticipants: number;
  totalMinutes: number;
  avgDuration: number;
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}

function AnalyticsContent() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [meetingsRes, statsRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/meetings/stats"),
      ]);
      if (meetingsRes.ok) setMeetings(await meetingsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed analytics
  const completedMeetings = meetings.filter((m) => m.status === "ended");
  const videoCount = meetings.filter((m) => m.type === "video").length;
  const audioCount = meetings.filter((m) => m.type === "audio").length;

  const avgParticipants =
    completedMeetings.length > 0
      ? (
          completedMeetings.reduce((sum, m) => sum + m.participants.length, 0) /
          completedMeetings.length
        ).toFixed(1)
      : "0";

  // Sessions by day of week
  const dayOfWeekCounts = new Array(7).fill(0);
  meetings.forEach((m) => {
    const day = new Date(m.createdAt).getDay();
    dayOfWeekCounts[day]++;
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxDayCount = Math.max(...dayOfWeekCounts, 1);

  // Recent sessions with duration
  const recentCompleted = completedMeetings
    .filter((m) => m.startedAt && m.endedAt)
    .slice(0, 5)
    .map((m) => {
      const durationMs =
        new Date(m.endedAt!).getTime() - new Date(m.startedAt!).getTime();
      const minutes = Math.round(durationMs / 60000);
      return { ...m, durationMinutes: minutes };
    });

  // Monthly trend
  const monthMap = new Map<string, number>();
  meetings.forEach((m) => {
    const key = new Date(m.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });
  const monthlyData = Array.from(monthMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-6);
  const maxMonthCount = Math.max(...monthlyData.map(([, v]) => v), 1);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Insights from your sessions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              label: "Total Sessions",
              value: stats.total,
              icon: Calendar,
              color: "blue",
              bgColor: "bg-blue-50",
              textColor: "text-blue-600",
            },
            {
              label: "Total Minutes",
              value: stats.totalMinutes,
              icon: Clock,
              color: "purple",
              bgColor: "bg-purple-50",
              textColor: "text-purple-600",
            },
            {
              label: "Avg Duration",
              value: `${stats.avgDuration}m`,
              icon: Timer,
              color: "green",
              bgColor: "bg-green-50",
              textColor: "text-green-600",
            },
            {
              label: "Participants",
              value: stats.totalParticipants,
              icon: Users,
              color: "amber",
              bgColor: "bg-amber-50",
              textColor: "text-amber-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <stat.icon size={20} className={stat.textColor} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Sessions by Day of Week */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Sessions by Day
          </h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {dayOfWeekCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  {count}
                </span>
                <div
                  className="w-full bg-blue-100 rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max((count / maxDayCount) * 100, 4)}%`,
                    minHeight: "4px",
                  }}
                >
                  <div
                    className="w-full bg-blue-500 rounded-t-lg"
                    style={{ height: "100%" }}
                  />
                </div>
                <span className="text-[11px] font-medium text-gray-400">
                  {dayNames[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Types */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Session Types
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Video className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Video
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {videoCount}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${meetings.length ? (videoCount / meetings.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Mic className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Audio
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {audioCount}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${meetings.length ? (audioCount / meetings.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-lg font-bold text-gray-900">
                    {avgParticipants}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Avg Participants
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-lg font-bold text-gray-900">
                    {stats?.active || 0}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Active Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Monthly Sessions
          </h3>
          <div className="flex items-end justify-between gap-3 h-32">
            {monthlyData.map(([month, count], i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  {count}
                </span>
                <div
                  className="w-full bg-green-500 rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max((count / maxMonthCount) * 100, 4)}%`,
                    minHeight: "4px",
                  }}
                />
                <span className="text-[11px] font-medium text-gray-400">
                  {month.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Recent Completed Sessions
        </h3>
        {recentCompleted.length === 0 ? (
          <div className="text-center py-10">
            <Activity className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No completed sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCompleted.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    meeting.type === "video"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {meeting.type === "video" ? (
                    <Video size={18} />
                  ) : (
                    <Mic size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {meeting.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(meeting.createdAt)}</span>
                    <span>{meeting.participants.length} participants</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">
                    {meeting.durationMinutes}m
                  </div>
                  <div className="text-xs text-gray-400">duration</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
