"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  Calendar,
  Trash2,
  Plus,
  Video,
  Mic,
  Users,
  Database,
  PlayCircle,
  Copy,
  Check,
  Loader2,
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

export default function EpisodesPage() {
  return (
    <DashboardLayout>
      <EpisodesContent />
    </DashboardLayout>
  );
}

function EpisodesContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "ended" | "waiting"
  >("all");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const filteredMeetings = meetings.filter((m) => {
    const matchesFilter = activeFilter === "all" || m.status === activeFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.participants.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    active: meetings.filter((m) => m.status === "active").length,
    ended: meetings.filter((m) => m.status === "ended").length,
    waiting: meetings.filter((m) => m.status === "waiting").length,
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "ended":
        return "bg-gray-100 text-gray-600";
      case "waiting":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Live";
      case "ended":
        return "Completed";
      case "waiting":
        return "Scheduled";
      default:
        return status;
    }
  };

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt) return "Not started";
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getGuests = (participants: Participant[]) => {
    const guests = participants.filter((p) => !p.isHost);
    if (guests.length === 0) return "No guests";
    return guests.map((g) => g.name).join(", ");
  };

  const handleCopyInvite = async (inviteCode: string, id: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/join/${inviteCode}`,
    );
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAFAF9]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Episodes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                All your recorded and scheduled sessions
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 overflow-x-auto scrollbar-thin">
              {[
                { key: "all" as const, label: "All", count: meetings.length },
                {
                  key: "active" as const,
                  label: "Live",
                  count: statusCounts.active,
                },
                {
                  key: "ended" as const,
                  label: "Completed",
                  count: statusCounts.ended,
                },
                {
                  key: "waiting" as const,
                  label: "Scheduled",
                  count: statusCounts.waiting,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
                    activeFilter === tab.key
                      ? "bg-[#37322F] text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="relative group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#37322F] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#37322F]/5 focus:border-[#37322F] transition-all w-full lg:w-72 text-sm font-medium"
              />
            </div>
          </div>

          {/* Session Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Database size={32} />
                </div>
                <h3 className="text-lg font-bold text-[#37322F]">
                  {meetings.length === 0
                    ? "No sessions yet"
                    : "No matching sessions"}
                </h3>
                <p className="text-gray-500 mt-1">
                  {meetings.length === 0
                    ? "Create your first session from the dashboard."
                    : "Try adjusting your filters or search query."}
                </p>
                {meetings.length === 0 && (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4" />
                    Create Session
                  </button>
                )}
              </div>
            ) : (
              filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl hover:border-gray-300 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    {/* Thumbnail */}
                    <div
                      className={`w-full sm:w-36 h-32 sm:h-24 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0 ${
                        meeting.type === "video"
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                          : "bg-gradient-to-br from-amber-400 to-orange-500"
                      }`}
                    >
                      <div className="absolute inset-0 bg-black/10 transition-all" />
                      {meeting.type === "video" ? (
                        <Video className="text-white/50" />
                      ) : (
                        <Mic className="text-white/50" />
                      )}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase tracking-tighter">
                        {meeting.type}
                      </div>
                      {meeting.status === "active" && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white animate-pulse">
                          LIVE
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(meeting.status)}`}
                        >
                          {getStatusLabel(meeting.status)}
                        </span>
                        <h3 className="text-lg font-bold text-[#37322F] truncate">
                          {meeting.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 font-medium flex items-center gap-2">
                        <Users size={14} />
                        {getGuests(meeting.participants)}
                      </p>

                      <div className="flex items-center flex-wrap gap-3 sm:gap-6">
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                          <Clock size={14} />
                          {formatDuration(meeting.startedAt, meeting.endedAt)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                          <Users size={14} />
                          {meeting.participants.length} participant
                          {meeting.participants.length !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                          <Calendar size={14} />
                          {formatDate(
                            meeting.scheduledAt || meeting.createdAt,
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-2">
                      {(meeting.status === "active" ||
                        meeting.status === "waiting") && (
                        <button
                          onClick={() =>
                            router.push(
                              `/meeting/${meeting.id}?title=${encodeURIComponent(meeting.title)}&type=${meeting.type}&host=true&name=Host`,
                            )
                          }
                          className="p-2 hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 rounded-lg transition-all"
                          title="Join Session"
                        >
                          <PlayCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleCopyInvite(meeting.inviteCode, meeting.id)
                        }
                        className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-all"
                        title="Copy Invite Link"
                      >
                        {copiedId === meeting.id ? (
                          <Check size={20} className="text-green-500" />
                        ) : (
                          <Copy size={20} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-all"
                        title="Delete Session"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
