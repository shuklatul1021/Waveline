"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Plus,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Video,
  PlayCircle,
  Loader2,
  Trash2,
  Users,
  Clock,
  Calendar,
  Mic,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

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
  _count?: { participants: number };
  participantCount?: number;
}

interface Participant {
  id: string;
  name: string;
  email: string | null;
  isHost: boolean;
  joinedAt: string;
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

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "ended" | "waiting"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingType, setMeetingType] = useState<"audio" | "video">("video");
  const [sessionType, setSessionType] = useState("podcast");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [scheduleType, setScheduleType] = useState<"instant" | "scheduled">(
    "instant",
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [enableRecording, setEnableRecording] = useState(true);

  // Real data state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchMeetings(), fetchStats()]).finally(() =>
      setLoading(false),
    );
  }, [fetchMeetings, fetchStats]);

  const filteredMeetings = meetings.filter((m) => {
    const matchesFilter = activeFilter === "all" || m.status === activeFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.participants.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / pageSize));
  const paginatedMeetings = filteredMeetings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const statusCounts = {
    active: meetings.filter((s) => s.status === "active").length,
    ended: meetings.filter((s) => s.status === "ended").length,
    waiting: meetings.filter((s) => s.status === "waiting").length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-50 text-green-700 border-green-200",
      ended: "bg-gray-50 text-gray-600 border-gray-200",
      waiting: "bg-blue-50 text-blue-700 border-blue-200",
    };
    const dotStyles: Record<string, string> = {
      active: "bg-green-500",
      ended: "bg-gray-400",
      waiting: "bg-blue-500",
    };
    const labels: Record<string, string> = {
      active: "Active",
      ended: "Completed",
      waiting: "Waiting",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.waiting}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || dotStyles.waiting}`}
        ></span>
        {labels[status] || status}
      </span>
    );
  };

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt) return "-";
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${String(mins).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return "Today";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getParticipantNames = (participants: Participant[]) => {
    if (participants.length === 0) return "-";
    const names = participants.filter((p) => !p.isHost).map((p) => p.name);
    if (names.length === 0) return "Host only";
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      alert("Please enter a session title");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle,
          description: meetingDescription,
          type: meetingType,
          maxParticipants,
          enableRecording,
          scheduledAt:
            scheduleType === "scheduled" && scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : null,
        }),
      });

      if (!response.ok) {
        alert("Failed to create session");
        return;
      }

      const meeting = await response.json();
      setShowCreateModal(false);
      setMeetingTitle("");
      setMeetingDescription("");

      if (scheduleType === "instant") {
        router.push(
          `/meeting/${meeting.id}?title=${encodeURIComponent(meetingTitle)}&type=${meetingType}&max=${maxParticipants}&host=true&name=Host`,
        );
      } else {
        await fetchMeetings();
        await fetchStats();
      }
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchMeetings();
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
    setActionMenuId(null);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white">
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sessions
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <PlayCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Now
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.active}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Guests
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalParticipants}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Minutes
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalMinutes}
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Sessions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track your sessions
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Session
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { key: "all" as const, label: "All", count: meetings.length },
              {
                key: "active" as const,
                label: "Active",
                count: statusCounts.active,
              },
              {
                key: "ended" as const,
                label: "Completed",
                count: statusCounts.ended,
              },
              {
                key: "waiting" as const,
                label: "Waiting",
                count: statusCounts.waiting,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === tab.key
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full lg:w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedMeetings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        No sessions found
                      </h3>
                      <p className="text-sm text-gray-500">
                        {meetings.length === 0
                          ? "Create your first session to get started."
                          : "Try adjusting your search or filters."}
                      </p>
                      {meetings.length === 0 && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create Session
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedMeetings.map((meeting) => (
                    <tr
                      key={meeting.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (
                          meeting.status === "active" ||
                          meeting.status === "waiting"
                        ) {
                          router.push(
                            `/meeting/${meeting.id}?title=${encodeURIComponent(meeting.title)}&type=${meeting.type}&host=true&name=Host`,
                          );
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {meeting.title}
                          </span>
                          {meeting.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                              {meeting.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          {meeting.type === "video" ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                          {meeting.type === "video" ? "Video" : "Audio"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(meeting.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {getParticipantNames(meeting.participants)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {meeting.status === "active"
                            ? "In Progress"
                            : formatDuration(
                                meeting.startedAt,
                                meeting.endedAt,
                              )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(meeting.scheduledAt || meeting.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(meeting.scheduledAt || meeting.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(
                                actionMenuId === meeting.id ? null : meeting.id,
                              );
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                          {actionMenuId === meeting.id && (
                            <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
                              {(meeting.status === "active" ||
                                meeting.status === "waiting") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/meeting/${meeting.id}?title=${encodeURIComponent(meeting.title)}&type=${meeting.type}&host=true&name=Host`,
                                    );
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Join
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMeeting(meeting.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredMeetings.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredMeetings.length)} of{" "}
                {filteredMeetings.length} results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-700 px-3">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create Session
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Set up your session
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="#374151"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Session Type
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="podcast">Podcast</option>
                  <option value="meeting">Meeting</option>
                  <option value="casual">Casual Conversation</option>
                  <option value="interview">Interview</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="white"
                    >
                      <circle cx="10" cy="10" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Enable Recording
                    </div>
                    <div className="text-xs text-gray-500">
                      Automatically record your session
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEnableRecording(!enableRecording)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${enableRecording ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-0.5 ${enableRecording ? "right-0.5" : "left-0.5"} w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  When do you want to start?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setScheduleType("instant")}
                    className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all ${scheduleType === "instant" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Start Instantly
                    </div>
                    <div className="text-xs mt-0.5 opacity-80">
                      Begin right away
                    </div>
                  </button>
                  <button
                    onClick={() => setScheduleType("scheduled")}
                    className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all ${scheduleType === "scheduled" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Schedule for Later
                    </div>
                    <div className="text-xs mt-0.5 opacity-80">
                      Pick a date and time
                    </div>
                  </button>
                </div>
              </div>

              {scheduleType === "scheduled" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g., Weekly Team Standup"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Recording Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMeetingType("video")}
                    className={`p-4 border rounded-xl transition-all text-center ${meetingType === "video" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Video className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <div className="text-sm font-medium text-gray-900">
                      Video
                    </div>
                    <div className="text-xs text-gray-500">Audio + Video</div>
                  </button>
                  <button
                    onClick={() => setMeetingType("audio")}
                    className={`p-4 border rounded-xl transition-all text-center ${meetingType === "audio" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Mic className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <div className="text-sm font-medium text-gray-900">
                      Audio Only
                    </div>
                    <div className="text-xs text-gray-500">Voice recording</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Max Participants
                </label>
                <select
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value={2}>2 People</option>
                  <option value={4}>4 People</option>
                  <option value={6}>6 People</option>
                  <option value={8}>8 People</option>
                  <option value={10}>10 People</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <PlayCircle className="w-5 h-5" />
                  )}
                  {scheduleType === "instant"
                    ? "Start Now"
                    : "Schedule Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
