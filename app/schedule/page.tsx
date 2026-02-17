"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Mic,
  Users,
  Loader2,
  PlayCircle,
  Copy,
  Check,
  Trash2,
  Plus,
  CalendarDays,
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

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <ScheduleContent />
    </DashboardLayout>
  );
}

function ScheduleContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

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

  const now = new Date();

  const scheduledMeetings = meetings.filter((m) => m.scheduledAt);
  const upcomingMeetings = scheduledMeetings
    .filter((m) => m.status === "waiting" && new Date(m.scheduledAt!) >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
    );

  const pastMeetings = scheduledMeetings
    .filter((m) => m.status === "ended" || new Date(m.scheduledAt!) < now)
    .sort(
      (a, b) =>
        new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime(),
    );

  const displayMeetings = view === "upcoming" ? upcomingMeetings : pastMeetings;

  const handleCopyInvite = async (inviteCode: string, id: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/join/${inviteCode}`,
    );
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scheduled session?")) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const formatScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - now.getTime();
    if (diff < 0) return "Past";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d`;
    }
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your upcoming and past scheduled sessions
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit mb-6">
        <button
          onClick={() => setView("upcoming")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "upcoming"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Upcoming ({upcomingMeetings.length})
        </button>
        <button
          onClick={() => setView("past")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "past"
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Past ({pastMeetings.length})
        </button>
      </div>

      {/* Sessions */}
      {displayMeetings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {view === "upcoming"
              ? "No upcoming sessions"
              : "No past scheduled sessions"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {view === "upcoming"
              ? "Schedule a new session to see it here."
              : "Completed scheduled sessions will appear here."}
          </p>
          {view === "upcoming" && (
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />
              Schedule Session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Date Pill */}
                <div className="flex items-center gap-3 sm:w-44 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      meeting.type === "video"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {meeting.type === "video" ? (
                      <Video size={20} />
                    ) : (
                      <Mic size={20} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatScheduledDate(meeting.scheduledAt!)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(meeting.scheduledAt!)}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {meeting.title}
                  </h3>
                  {meeting.description && (
                    <p className="text-sm text-gray-400 truncate mt-0.5">
                      {meeting.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <Users size={12} />
                      {meeting.participants.length} participant
                      {meeting.participants.length !== 1 ? "s" : ""}
                    </span>
                    {view === "upcoming" && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {getTimeUntil(meeting.scheduledAt!)}
                      </span>
                    )}
                    {meeting.status === "ended" && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {meeting.status === "waiting" && (
                    <button
                      onClick={() =>
                        router.push(
                          `/meeting/${meeting.id}?title=${encodeURIComponent(meeting.title)}&type=${meeting.type}&host=true&name=Host`,
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      <PlayCircle size={14} />
                      Start
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
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
