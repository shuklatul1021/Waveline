"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlay, PlayCircle, Settings, Video } from "lucide-react";
import { Play } from "next/font/google";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";

interface PodcastEpisode {
    id: string;
    title: string;
    guests: string;
    status: "published" | "draft" | "recording";
    duration: string;
    listens: string;
    recordedDate: string;
    publishedDate: string;
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
        "all" | "published" | "draft" | "recording"
    >("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Create Meeting Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState("");
    const [meetingDescription, setMeetingDescription] = useState("");
    const [meetingType, setMeetingType] = useState<"audio" | "video">("video");
    const [sessionType, setSessionType] = useState("podcast");
    const [maxParticipants, setMaxParticipants] = useState(2);
    const [scheduleType, setScheduleType] = useState<"instant" | "scheduled">("instant");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [guestEmails, setGuestEmails] = useState("");
    const [enableRecording, setEnableRecording] = useState(true);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Generate audio bars once (only on initial render)
    const [hostAudioBars] = useState(() =>
        Array.from({ length: 5 }).map(() => Math.random() * 12 + 8),
    );
    const [guestAudioBars] = useState(() =>
        Array.from({ length: 5 }).map(() => Math.random() * 12 + 8),
    );
    const [participantAudioBars] = useState(() =>
        Array.from({ length: 5 }).map(() => Math.random() * 12 + 8),
    );
    const [waveformBars] = useState(() =>
        Array.from({ length: 60 }).map((_, i) => i),
    );

    // Simulate recording timer
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const [inviteUrl, setInviteUrl] = useState("");
    const [showInviteModal, setShowInviteModal] = useState(false);

    const handleCreateMeeting = async () => {
        if (!meetingTitle.trim()) {
            alert("Please enter a meeting title");
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
                alert("Failed to create meeting");
                return;
            }

            const meeting = await response.json();
            setInviteUrl(`${window.location.origin}/join/${meeting.inviteCode}`);
            setShowInviteModal(true);
            setShowCreateModal(false);

            // Navigate to meeting room
            router.push(
                `/meeting/${meeting.id}?title=${encodeURIComponent(meetingTitle)}&type=${meetingType}&max=${maxParticipants}`,
            );
        } catch (error) {
            console.error("Error creating meeting:", error);
            alert("Failed to create meeting");
        }
    };

    // Mock data
    const mockEpisodes: PodcastEpisode[] = [
        {
            id: "1",
            title: "The Future of AI in Content Creation",
            guests: "Sarah Mitchell",
            status: "published",
            duration: "42:15",
            listens: "1,247",
            recordedDate: "1 Aug 2024",
            publishedDate: "3 Aug 2024",
        },
        {
            id: "2",
            title: "Building Successful Podcasts from Scratch",
            guests: "John Davis, Mike Chen",
            status: "published",
            duration: "38:30",
            listens: "892",
            recordedDate: "5 Aug 2024",
            publishedDate: "7 Aug 2024",
        },
        {
            id: "3",
            title: "Monetization Strategies for Creators",
            guests: "Emily Rodriguez",
            status: "draft",
            duration: "45:00",
            listens: "-",
            recordedDate: "8 Aug 2024",
            publishedDate: "-",
        },
        {
            id: "4",
            title: "Interview with Tech Entrepreneur",
            guests: "Alex Thompson",
            status: "recording",
            duration: "In Progress",
            listens: "-",
            recordedDate: "10 Aug 2024",
            publishedDate: "Scheduled",
        },
        {
            id: "5",
            title: "Storytelling Techniques for Podcasters",
            guests: "Lisa Anderson, Tom Wilson",
            status: "published",
            duration: "51:20",
            listens: "2,143",
            recordedDate: "12 Aug 2024",
            publishedDate: "14 Aug 2024",
        },
        {
            id: "6",
            title: "Growing Your Audience Organically",
            guests: "Rachel Kim",
            status: "published",
            duration: "36:45",
            listens: "1,678",
            recordedDate: "15 Aug 2024",
            publishedDate: "17 Aug 2024",
        },
    ];

    const filteredEpisodes = mockEpisodes.filter((episode) => {
        const matchesFilter =
            activeFilter === "all" || episode.status === activeFilter;
        const matchesSearch =
            episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            episode.guests.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        published: mockEpisodes.filter((e) => e.status === "published").length,
        draft: mockEpisodes.filter((e) => e.status === "draft").length,
        recording: mockEpisodes.filter((e) => e.status === "recording").length,
    };

    return (
        <div>
            <main className="flex-1 overflow-auto p-8 bg-gray-50">
                <div className="bg-gradient-to-br from-[#37322F] via-[#4a4340] to-[#5D5651] rounded-2xl p-10 mb-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 max-w-4xl">
                        <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                            AI-Powered Podcast Platform
                        </div>
                        <h1 className="text-4xl font-bold mb-4 leading-tight">
                            Record & Publish Your Podcast in Minutes
                        </h1>
                        <p className="text-xl text-gray-200 mb-8 max-w-2xl">
                            Studio-quality recording with remote guests. AI editing removes filler words.
                            One-click distribution to Spotify, Apple Podcasts, and 20+ platforms.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-6 py-3.5 bg-white text-[#37322F] rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg hover:shadow-xl"
                            >
                                <Video />
                                Start Session Now
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-semibold border border-white/20">
                                <PlayCircle />
                                Watch Demo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2ZM18 10C18 13.3 15.3 16 12 16C8.7 16 6 13.3 6 10H4C4 13.9 6.9 17.2 10.5 17.9V21H13.5V17.9C17.1 17.2 20 13.9 20 10H18Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#37322F] mb-2">Studio-Quality Recording</h3>
                        <p className="text-[#6B6B6B] text-sm leading-relaxed">
                            Record with up to 10 remote guests. Crystal-clear audio, automatic echo cancellation, and real-time monitoring.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#37322F] mb-2">AI-Powered Editing</h3>
                        <p className="text-[#6B6B6B] text-sm leading-relaxed">
                            Automatically remove filler words, silence, and background noise. Get a polished podcast in minutes, not hours.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#37322F] mb-2">One-Click Distribution</h3>
                        <p className="text-[#6B6B6B] text-sm leading-relaxed">
                            Publish to Spotify, Apple Podcasts, Google Podcasts, and 20+ platforms simultaneously with a single click.
                        </p>
                    </div>
                </div>

                {/* Platform Integration Badges */}
                <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-[#9B9B98] uppercase tracking-wider mb-4">
                        Publish Everywhere
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-colors">
                            <img className="w-6 h-6 rounded-2xl" src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"></img>
                            <span className="font-medium text-sm text-[#37322F]">Spotify</span>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-colors">
                            <img className="w-6 h-6 rounded-2xl" src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Podcasts_%28iOS%29.svg"></img>
                            <span className="font-medium text-sm text-[#37322F]">Apple Podcasts</span>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-colors">
                            <img className="w-6 h-6 rounded-2xl" src="https://upload.wikimedia.org/wikipedia/commons/2/25/Google_Podcasts_icon.svg"></img>
                            <span className="font-medium text-sm text-[#37322F]">Google Podcasts</span>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-colors">
                            <img className="w-6 h-6 rounded-2xl" src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg"></img>
                            <span className="font-medium text-sm text-[#37322F]">Youtube</span>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                            <span className="font-medium text-sm text-[#6B6B6B]">+5 more</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#3B82F6">
                                <path
                                    d="M10 4V16M4 10H16"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-[#37322F]">Invite Guest</div>
                            <div className="text-xs text-[#9B9B98]">
                                Send recording link
                            </div>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#9333EA">
                                <path
                                    d="M4 6H16M4 10H16M4 14H10"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-[#37322F]">Add Notes</div>
                            <div className="text-xs text-[#9B9B98]">
                                Timestamps & comments
                            </div>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="#22C55E">
                                <path
                                    d="M3 17V7C3 6.46957 3.21071 5.96086 3.58579 5.58579C3.96086 5.21071 4.46957 5 5 5H15C15.5304 5 16.0391 5.21071 16.4142 5.58579C16.7893 5.96086 17 6.46957 17 7V17L10 13L3 17Z"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-[#37322F]">Save Draft</div>
                            <div className="text-xs text-[#9B9B98]">Continue later</div>
                        </div>
                    </button>
                </div>

                {/* Participants Section */}
                <div className="bg-white rounded-lg border border-[#E5E5E0] p-6 mb-6">
                    <h3 className="text-lg font-semibold text-[#37322F] mb-4">
                        Active Participants
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-[#F7F5F3] rounded-lg">
                            <div className="w-10 h-10 bg-[#37322F] rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">JD</span>
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-[#37322F]">
                                    John Doe (You)
                                </div>
                                <div className="text-xs text-[#9B9B98]">Host</div>
                            </div>
                            <div className="flex items-center gap-1">
                                {participantAudioBars.map((height, i) => (
                                    <div
                                        key={i}
                                        className="w-1 h-3 bg-green-500 rounded-full"
                                        style={{ height: `${height}px` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <button className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#E5E5E0] rounded-lg hover:border-[#37322F] hover:bg-[#F7F5F3] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M10 4V16M4 10H16"
                                    stroke="#37322F"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="text-sm font-medium text-[#37322F]">
                                Invite Guest
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-[#9B9B98] mb-1">
                                    Total Episodes
                                </div>
                                <div className="text-2xl font-semibold text-[#37322F]">
                                    42
                                </div>
                                <div className="text-xs text-[#22C55E] mt-1">
                                    +6 from last month
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-[#F7F5F3] rounded-lg flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M3 8L12 13L21 8M3 8L12 3L21 8M3 8V16L12 21M21 8V16L12 21M12 21V13"
                                        stroke="#37322F"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-[#9B9B98] mb-1">
                                    Total Listens
                                </div>
                                <div className="text-2xl font-semibold text-[#37322F]">
                                    12.4K
                                </div>
                                <div className="text-xs text-[#22C55E] mt-1">
                                    +18.3% from last month
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-[#F7F5F3] rounded-lg flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M4 4V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H20M8 16L12 12L14 14L20 8M20 8V12M20 8H16"
                                        stroke="#37322F"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-[#9B9B98] mb-1">
                                    Recording Time
                                </div>
                                <div className="text-2xl font-semibold text-[#37322F]">
                                    28.5h
                                </div>
                                <div className="text-xs text-[#9B9B98] mt-1">
                                    Across all episodes
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-[#F7F5F3] rounded-lg flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                        stroke="#37322F"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-lg border border-[#E5E5E0] overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-[#E5E5E0]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-[#37322F]">
                                    Podcast Episodes
                                </h2>
                                <p className="text-sm text-[#9B9B98]">
                                    Manage and track your episodes
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F7F5F3] transition-colors text-sm font-medium text-[#37322F]">
                                    Export
                                </button>
                                <button className="px-4 py-2 bg-[#37322F] text-white rounded-lg hover:bg-[#49423D] transition-colors text-sm font-medium">
                                    Start Recording
                                </button>
                            </div>
                        </div>

                        {/* Filters and Search */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveFilter("all")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "all"
                                        ? "bg-[#F7F5F3] text-[#37322F]"
                                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveFilter("published")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "published"
                                        ? "bg-[#F7F5F3] text-[#37322F]"
                                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                                        }`}
                                >
                                    Published ({stats.published})
                                </button>
                                <button
                                    onClick={() => setActiveFilter("draft")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "draft"
                                        ? "bg-[#F7F5F3] text-[#37322F]"
                                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                                        }`}
                                >
                                    Draft ({stats.draft})
                                </button>
                                <button
                                    onClick={() => setActiveFilter("recording")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "recording"
                                        ? "bg-[#F7F5F3] text-[#37322F]"
                                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                                        }`}
                                >
                                    Recording ({stats.recording})
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent text-sm"
                                    />
                                    <svg
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                                            stroke="#9B9B98"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M14 14L11.1 11.1"
                                            stroke="#9B9B98"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <button className="px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F7F5F3] transition-colors text-sm font-medium text-[#37322F] flex items-center gap-2">
                                    Sort order
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FAFAF9] border-b border-[#E5E5E0]">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            className="rounded border-[#E5E5E0]"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                        Episode Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                        Guests
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                        Listens
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                        Published
                                    </th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E0]">
                                {filteredEpisodes.map((episode) => (
                                    <tr
                                        key={episode.id}
                                        className="hover:bg-[#FAFAF9] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-[#E5E5E0]"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-[#37322F]">
                                                {episode.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${episode.status === "published"
                                                    ? "bg-[#DCFCE7] text-[#166534]"
                                                    : episode.status === "draft"
                                                        ? "bg-[#FEF3C7] text-[#854D0E]"
                                                        : "bg-[#DBEAFE] text-[#1E40AF]"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${episode.status === "published"
                                                        ? "bg-[#22C55E]"
                                                        : episode.status === "draft"
                                                            ? "bg-[#EAB308]"
                                                            : "bg-[#3B82F6]"
                                                        }`}
                                                ></span>
                                                {episode.status.charAt(0).toUpperCase() +
                                                    episode.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-[#37322F]">
                                                {episode.guests}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-[#6B6B68]">
                                                {episode.duration}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-[#6B6B68]">
                                                {episode.listens}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-[#6B6B68]">
                                                {episode.publishedDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-[#F7F5F3] rounded-lg transition-colors">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 16 16"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M8 4C8.55228 4 9 3.55228 9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3C7 3.55228 7.44772 4 8 4Z"
                                                        fill="#6B6B68"
                                                    />
                                                    <path
                                                        d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z"
                                                        fill="#6B6B68"
                                                    />
                                                    <path
                                                        d="M8 14C8.55228 14 9 13.5523 9 13C9 12.4477 8.55228 12 8 12C7.44772 12 7 12.4477 7 13C7 13.5523 7.44772 14 8 14Z"
                                                        fill="#6B6B68"
                                                    />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-[#E5E5E0] flex items-center justify-between">
                        <div className="text-sm text-[#9B9B98]">
                            1-{filteredEpisodes.length} of {mockEpisodes.length} results
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F7F5F3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M10 12L6 8L10 4"
                                        stroke="#37322F"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <span className="text-sm text-[#37322F] px-3">1 / 1</span>
                            <button className="px-3 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F7F5F3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M6 12L10 8L6 4"
                                        stroke="#37322F"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Meeting Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#37322F]">
                                        Start Session
                                    </h2>
                                    <p className="text-sm text-[#9B9B98] mt-1">
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
                                            stroke="#37322F"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6 space-y-6">
                            {/* Session Type Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-[#37322F] mb-2">
                                    Session Type
                                </label>
                                <select
                                    value={sessionType}
                                    onChange={(e) => setSessionType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                                >
                                    <option value="podcast">Podcast</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="casual">Casual Conversation</option>
                                    <option value="interview">Interview</option>
                                    <option value="presentation">Presentation</option>
                                </select>
                            </div>

                            {/* Recording Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                                            <circle cx="10" cy="10" r="4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-[#37322F]">
                                            Enable Recording
                                        </div>
                                        <div className="text-xs text-[#6B6B68]">
                                            Automatically record your session
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableRecording(!enableRecording)}
                                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${enableRecording ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 ${enableRecording ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300`} />
                                </button>
                            </div>

                            {/* Schedule Type Toggle */}
                            <div>
                                <label className="block text-sm font-semibold text-[#37322F] mb-3">
                                    When do you want to record?
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setScheduleType("instant")}
                                        className={`px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${scheduleType === "instant"
                                            ? "border-[#37322F] bg-[#37322F] text-white"
                                            : "border-gray-300 bg-white text-[#37322F] hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {scheduleType === "instant" && (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                                                    <circle cx="8" cy="8" r="3" />
                                                </svg>
                                            )}
                                            Start Instantly
                                        </div>
                                        <div className="text-xs mt-0.5 opacity-80">Begin recording right away</div>
                                    </button>

                                    <button
                                        onClick={() => setScheduleType("scheduled")}
                                        className={`px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${scheduleType === "scheduled"
                                            ? "border-[#37322F] bg-[#37322F] text-white"
                                            : "border-gray-300 bg-white text-[#37322F] hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {scheduleType === "scheduled" && (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <rect x="2" y="3" width="12" height="12" rx="1.5" stroke="white" strokeWidth="1.5" />
                                                    <path d="M2 6H14M5 1.5V3M11 1.5V3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            )}
                                            Schedule for Later
                                        </div>
                                        <div className="text-xs mt-0.5 opacity-80">Pick a date and time</div>
                                    </button>
                                </div>
                            </div>

                            {/* Scheduled Date & Time (only shown when scheduled) */}
                            {scheduleType === "scheduled" && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-medium text-[#37322F] mb-2">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent bg-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#37322F] mb-1.5">
                                            Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent bg-white text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-semibold text-[#37322F] mb-2">
                                    Episode Title *
                                </label>
                                <input
                                    type="text"
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                    placeholder="e.g., Tech Talk Episode 1: The Future of AI"
                                    className="w-full px-4 py-2.5 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-[#37322F] mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={meetingDescription}
                                    onChange={(e) => setMeetingDescription(e.target.value)}
                                    placeholder="Brief description of what this episode is about..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-[#37322F] mb-3">
                                    Recording Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setMeetingType("video")}
                                        className={`p-3 border rounded-lg transition-all text-center ${meetingType === "video"
                                            ? "border-[#37322F] bg-[#F7F5F3]"
                                            : "border-gray-300 hover:border-[#37322F]"
                                            }`}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="mx-auto mb-1.5"
                                        >
                                            <path
                                                d="M23 7L16 12L23 17V7Z"
                                                stroke="#37322F"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <rect
                                                x="1"
                                                y="5"
                                                width="15"
                                                height="14"
                                                rx="2"
                                                stroke="#37322F"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                        <div className="text-sm font-medium text-[#37322F]">
                                            Video
                                        </div>
                                        <div className="text-xs text-[#6B6B68] mt-0.5">
                                            Audio + Video
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setMeetingType("audio")}
                                        className={`p-3 border rounded-lg transition-all text-center ${meetingType === "audio"
                                            ? "border-[#37322F] bg-[#F7F5F3]"
                                            : "border-gray-300 hover:border-[#37322F]"
                                            }`}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="mx-auto mb-1.5"
                                        >
                                            <path
                                                d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z"
                                                stroke="#37322F"
                                                strokeWidth="2"
                                            />
                                            <path
                                                d="M19 10V12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20M5 10V12C5 14.1217 5.84285 16.1566 7.34315 17.6569C8.84344 19.1571 10.8783 20 13 20M12 20V23"
                                                stroke="#37322F"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="text-sm font-medium text-[#37322F]">
                                            Audio Only
                                        </div>
                                        <div className="text-xs text-[#6B6B68] mt-0.5">
                                            Voice recording
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Max Participants */}
                                <div>
                                    <label className="block text-sm font-semibold text-[#37322F] mb-2">
                                        Max Participants
                                    </label>
                                    <select
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                                    >
                                        <option value={2}>2 People</option>
                                        <option value={4}>4 People</option>
                                        <option value={6}>6 People</option>
                                        <option value={8}>8 People</option>
                                        <option value={10}>10 People</option>
                                    </select>
                                </div>

                                {/* Guest Emails */}
                                <div>
                                    <label className="block text-sm font-semibold text-[#37322F] mb-2">
                                        Invite Guests (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={guestEmails}
                                        onChange={(e) => setGuestEmails(e.target.value)}
                                        placeholder="guest@email.com, ..."
                                        className="w-full px-4 py-2.5 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Feature Highlights */}
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                                <div className="flex items-start gap-3 mb-2">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="#7C3AED" className="mt-0.5">
                                        <path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-semibold text-[#37322F] mb-1">Premium Features Included</h4>
                                        <ul className="text-xs text-[#6B6B68] space-y-1">
                                            <li>✓ Studio-quality audio recording</li>
                                            <li>✓ AI-powered noise cancellation</li>
                                            <li>✓ Automatic filler word removal</li>
                                            <li>✓ Live transcription & editing</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-6 rounded-b-2xl">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-[#E5E5E0] rounded-xl hover:bg-[#F7F5F3] transition-colors font-semibold text-[#37322F]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateMeeting}
                                    className="flex-1 px-6 py-3 bg-[#37322F] text-white rounded-xl hover:bg-[#49423D] transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {scheduleType === "instant" ? (
                                        <>
                                            <CirclePlay className="w-5 h-5" />
                                            Start Now
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <rect x="3" y="4" width="14" height="14" rx="2" stroke="white" strokeWidth="1.5" />
                                                <path d="M3 8H17M7 2V4M13 2V4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            Schedule Recording
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

