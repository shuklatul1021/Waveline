"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Search, SlidersHorizontal, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight, Video, PlayCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

interface Session {
    id: string;
    title: string;
    type: "podcast" | "meeting" | "interview" | "presentation" | "casual";
    participants: string;
    status: "active" | "completed" | "scheduled";
    duration: string;
    date: string;
    time: string;
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
    const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed" | "scheduled">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState("");
    const [meetingDescription, setMeetingDescription] = useState("");
    const [meetingType, setMeetingType] = useState<"audio" | "video">("video");
    const [sessionType, setSessionType] = useState("podcast");
    const [maxParticipants, setMaxParticipants] = useState(2);
    const [scheduleType, setScheduleType] = useState<"instant" | "scheduled">("instant");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [enableRecording, setEnableRecording] = useState(true);

    // Mock data
    const mockSessions: Session[] = [
        {
            id: "1",
            title: "Weekly Team Standup",
            type: "meeting",
            participants: "Sarah, John, Mike",
            status: "completed",
            duration: "45:00",
            date: "Aug 10, 2024",
            time: "10:00 AM",
        },
        {
            id: "2",
            title: "Tech Talk: Future of AI",
            type: "podcast",
            participants: "Emily Rodriguez",
            status: "completed",
            duration: "42:15",
            date: "Aug 8, 2024",
            time: "2:00 PM",
        },
        {
            id: "3",
            title: "Product Demo Session",
            type: "presentation",
            participants: "Client Team",
            status: "scheduled",
            duration: "-",
            date: "Aug 15, 2024",
            time: "3:00 PM",
        },
        {
            id: "4",
            title: "Interview with Alex Thompson",
            type: "interview",
            participants: "Alex Thompson",
            status: "active",
            duration: "In Progress",
            date: "Today",
            time: "11:00 AM",
        },
        {
            id: "5",
            title: "Casual Friday Hangout",
            type: "casual",
            participants: "Team Members",
            status: "completed",
            duration: "1:20:00",
            date: "Aug 9, 2024",
            time: "4:00 PM",
        },
        {
            id: "6",
            title: "Q3 Planning Meeting",
            type: "meeting",
            participants: "Leadership Team",
            status: "completed",
            duration: "55:30",
            date: "Aug 7, 2024",
            time: "9:00 AM",
        },
    ];

    const filteredSessions = mockSessions.filter((session) => {
        const matchesFilter = activeFilter === "all" || session.status === activeFilter;
        const matchesSearch =
            session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.participants.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        active: mockSessions.filter((s) => s.status === "active").length,
        completed: mockSessions.filter((s) => s.status === "completed").length,
        scheduled: mockSessions.filter((s) => s.status === "scheduled").length,
    };

    const getTypeLabel = (type: Session["type"]) => {
        const labels = {
            podcast: "Podcast",
            meeting: "Meeting",
            interview: "Interview",
            presentation: "Presentation",
            casual: "Casual",
        };
        return labels[type];
    };

    const getStatusBadge = (status: Session["status"]) => {
        const styles = {
            active: "bg-green-50 text-green-700 border-green-200",
            completed: "bg-gray-50 text-gray-600 border-gray-200",
            scheduled: "bg-blue-50 text-blue-700 border-blue-200",
        };
        const labels = {
            active: "Active",
            completed: "Completed",
            scheduled: "Scheduled",
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : status === "scheduled" ? "bg-blue-500" : "bg-gray-400"}`}></span>
                {labels[status]}
            </span>
        );
    };

    const handleCreateMeeting = async () => {
        if (!meetingTitle.trim()) {
            alert("Please enter a session title");
            return;
        }

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
                    scheduledAt: scheduleType === "scheduled" && scheduledDate && scheduledTime
                        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                        : null,
                    hostName: "Host",
                }),
            });

            if (!response.ok) {
                alert("Failed to create session");
                return;
            }

            const meeting = await response.json();
            setShowCreateModal(false);
            router.push(`/meeting/${meeting.id}?title=${encodeURIComponent(meetingTitle)}&type=${meetingType}&max=${maxParticipants}`);
        } catch (error) {
            console.error("Error creating session:", error);
            alert("Failed to create session");
        }
    };

    return (
        <div className="flex-1 bg-white">
            <main className="p-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Sessions</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage and track your sessions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Session
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveFilter("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "all" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter("active")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "active" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        >
                            Active ({stats.active})
                        </button>
                        <button
                            onClick={() => setActiveFilter("completed")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "completed" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        >
                            Completed ({stats.completed})
                        </button>
                        <button
                            onClick={() => setActiveFilter("scheduled")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "scheduled" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        >
                            Scheduled ({stats.scheduled})
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                        </div>
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Sort order
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input type="checkbox" className="rounded border-gray-300" />
                                </th>
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
                            {filteredSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-900">{session.title}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{getTypeLabel(session.type)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(session.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{session.participants}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">{session.duration}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">{session.date}</div>
                                        <div className="text-xs text-gray-400">{session.time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            1-{filteredSessions.length} of {mockSessions.length} results
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="text-sm text-gray-700 px-3">1 / 1</span>
                            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Create Session</h2>
                                    <p className="text-sm text-gray-500 mt-1">Set up your session</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M15 5L5 15M5 5L15 15" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6 space-y-6">
                            {/* Session Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Session Type</label>
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

                            {/* Recording Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                                            <circle cx="10" cy="10" r="4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Enable Recording</div>
                                        <div className="text-xs text-gray-500">Automatically record your session</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableRecording(!enableRecording)}
                                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${enableRecording ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 ${enableRecording ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300`} />
                                </button>
                            </div>

                            {/* Schedule Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-3">When do you want to start?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setScheduleType("instant")}
                                        className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all ${scheduleType === "instant" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"}`}
                                    >
                                        <div className="flex items-center justify-center gap-2">Start Instantly</div>
                                        <div className="text-xs mt-0.5 opacity-80">Begin right away</div>
                                    </button>
                                    <button
                                        onClick={() => setScheduleType("scheduled")}
                                        className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all ${scheduleType === "scheduled" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"}`}
                                    >
                                        <div className="flex items-center justify-center gap-2">Schedule for Later</div>
                                        <div className="text-xs mt-0.5 opacity-80">Pick a date and time</div>
                                    </button>
                                </div>
                            </div>

                            {/* Scheduled Date & Time */}
                            {scheduleType === "scheduled" && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">Time</label>
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Session Title</label>
                                <input
                                    type="text"
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                    placeholder="e.g., Weekly Team Standup"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description (Optional)</label>
                                <textarea
                                    value={meetingDescription}
                                    onChange={(e) => setMeetingDescription(e.target.value)}
                                    placeholder="Brief description..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Recording Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-3">Recording Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setMeetingType("video")}
                                        className={`p-4 border rounded-xl transition-all text-center ${meetingType === "video" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                                    >
                                        <Video className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                                        <div className="text-sm font-medium text-gray-900">Video</div>
                                        <div className="text-xs text-gray-500">Audio + Video</div>
                                    </button>
                                    <button
                                        onClick={() => setMeetingType("audio")}
                                        className={`p-4 border rounded-xl transition-all text-center ${meetingType === "audio" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
                                            <path d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z" stroke="#374151" strokeWidth="2" />
                                            <path d="M19 10V12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20M5 10V12C5 14.1217 5.84285 16.1566 7.34315 17.6569C8.84344 19.1571 10.8783 20 13 20M12 20V23" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        <div className="text-sm font-medium text-gray-900">Audio Only</div>
                                        <div className="text-xs text-gray-500">Voice recording</div>
                                    </button>
                                </div>
                            </div>

                            {/* Max Participants */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Max Participants</label>
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

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-6 rounded-b-2xl">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateMeeting}
                                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2"
                                >
                                    <PlayCircle className="w-5 h-5" />
                                    {scheduleType === "instant" ? "Start Now" : "Schedule Session"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

