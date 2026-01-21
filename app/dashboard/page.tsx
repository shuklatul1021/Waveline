"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "published" | "draft" | "recording"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Create Meeting Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState<"audio" | "video">("video");
  const [maxParticipants, setMaxParticipants] = useState(2);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(65);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [guestVideoEnabled] = useState(true); // Guest controls can be added later
  const [guestAudioEnabled] = useState(true); // Guest controls can be added later

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
        setRecordingTime((prev) => prev + 1);
        // Simulate audio level changes
        setAudioLevel(Math.floor(Math.random() * 40) + 40);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCreateMeeting = () => {
    if (!meetingTitle.trim()) {
      alert("Please enter a meeting title");
      return;
    }
    // Generate meeting ID and redirect
    const meetingId = Math.random().toString(36).substring(7);
    router.push(
      `/meeting/${meetingId}?title=${encodeURIComponent(meetingTitle)}&type=${meetingType}&max=${maxParticipants}`,
    );
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
    <div className="flex h-screen bg-[#FAFAF9] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-[#E5E5E0] flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#E5E5E0]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#37322F] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold text-[#37322F]">PodcastHub</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-[#37322F] rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">R</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F7F5F3] text-[#37322F] font-medium hover:bg-[#F0EFEE] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 10L10 3L17 10M5 8V17C5 17.5304 5.21071 18.0391 5.58579 18.4142C5.96086 18.7893 6.46957 19 7 19H13C13.5304 19 14.0391 18.7893 14.4142 18.4142C14.7893 18.0391 15 17.5304 15 17V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarCollapsed && <span>Home</span>}
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M17 18V16C17 14.9391 16.5786 13.9217 15.8284 13.1716C15.0783 12.4214 14.0609 12 13 12H7C5.93913 12 4.92172 12.4214 4.17157 13.1716C3.42143 13.9217 3 14.9391 3 16V18M13 6C13 7.65685 11.6569 9 10 9C8.34315 9 7 7.65685 7 6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarCollapsed && <span>Guests</span>}
            </button>

            {!sidebarCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                  Episodes
                </span>
              </div>
            )}

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 8L10 13L17 8M3 8L10 3L17 8M3 8V16L10 21M17 8V16L10 21M10 21V13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarCollapsed && <span>All Episodes</span>}
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 5H17M3 10H17M3 15H17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarCollapsed && <span>Audio Library</span>}
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 4V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H17M7 14L10 11L12 13L17 8M17 8V11M17 8H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarCollapsed && <span>Analytics</span>}
            </button>

            {!sidebarCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                  Settings
                </span>
              </div>
            )}

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-[#E5E5E0]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-[#37322F] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#37322F] truncate">
                  John Doe
                </div>
                <div className="text-xs text-[#9B9B98] truncate">
                  john@company.com
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E5E5E0] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-[#F7F5F3] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 10H17M3 5H17M3 15H17"
                  stroke="#37322F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-[#37322F]">
              My Episodes
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#F7F5F3] rounded-lg transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 6L9 12L5 8"
                  stroke="#37322F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-[#37322F] rounded-full"></div>
          </div>
        </header>

        {/* Recording Interface */}
        <main className="flex-1 overflow-auto p-6">
          {/* Create Meeting Banner */}
          <div className="bg-gradient-to-r from-[#37322F] to-[#5D5651] rounded-xl p-8 mb-6 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-2">
                Start Your Podcast Session
              </h2>
              <p className="text-gray-200 mb-6">
                Create a new recording session or meeting with your guests
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#37322F] rounded-lg hover:bg-gray-100 transition-all font-medium shadow-lg"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M10 5V15M5 10H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Create Podcast or Meeting
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-[#E5E5E0] p-5">
              {isVideoEnabled ? (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                  <div className="text-white text-6xl font-bold">JD</div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#37322F] rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-2xl font-bold">JD</span>
                    </div>
                    <p className="text-white text-sm">Camera Off</p>
                  </div>
                </div>
              )}

              {/* Host Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-blue-500 rounded text-xs font-medium text-white">
                      HOST
                    </div>
                    <span className="text-white font-medium">
                      John Doe (You)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hostAudioBars.map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${
                          isAudioEnabled ? "bg-green-400" : "bg-gray-500"
                        }`}
                        style={{
                          height: isAudioEnabled ? `${height}px` : "4px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Recording Indicator */}
              {isRecording && !isPaused && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-medium">
                    REC {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {/* Host Video Controls */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full p-2">
                  <button
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoEnabled
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="white"
                    >
                      {isVideoEnabled ? (
                        <path d="M2 5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H12C12.5304 3 13.0391 3.21071 13.4142 3.58579C13.7893 3.96086 14 4.46957 14 5V15C14 15.5304 13.7893 16.0391 13.4142 16.4142C13.0391 16.7893 12.5304 17 12 17H4C3.46957 17 2.96086 16.7893 2.58579 16.4142C2.21071 16.0391 2 15.5304 2 15V5ZM16 7L18.553 5.276C18.7054 5.17326 18.8831 5.11414 19.0674 5.10538C19.2517 5.09662 19.4346 5.13859 19.5965 5.22654C19.7584 5.31449 19.8933 5.44503 19.9873 5.60384C20.0813 5.76266 20.1309 5.94388 20.131 6.129V13.871C20.131 14.234 19.948 14.571 19.647 14.776L16 13V7Z" />
                      ) : (
                        <>
                          <path d="M2 5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H12C12.5304 3 13.0391 3.21071 13.4142 3.58579C13.7893 3.96086 14 4.46957 14 5V15C14 15.5304 13.7893 16.0391 13.4142 16.4142C13.0391 16.7893 12.5304 17 12 17H4C3.46957 17 2.96086 16.7893 2.58579 16.4142C2.21071 16.0391 2 15.5304 2 15V5Z" />
                          <path
                            d="M2 2L18 18"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className={`p-3 rounded-full transition-colors ${
                      isAudioEnabled
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="white"
                    >
                      {isAudioEnabled ? (
                        <path d="M10 1C9.20435 1 8.44129 1.31607 7.87868 1.87868C7.31607 2.44129 7 3.20435 7 4V10C7 10.7956 7.31607 11.5587 7.87868 12.1213C8.44129 12.6839 9.20435 13 10 13C10.7956 13 11.5587 12.6839 12.1213 12.1213C12.6839 11.5587 13 10.7956 13 10V4C13 3.20435 12.6839 2.44129 12.1213 1.87868C11.5587 1.31607 10.7956 1 10 1ZM5 9V10C5 11.3261 5.52678 12.5979 6.46447 13.5355C7.40215 14.4732 8.67392 15 10 15C11.3261 15 12.5979 14.4732 13.5355 13.5355C14.4732 12.5979 15 11.3261 15 10V9H17V10C17 11.8565 16.2625 13.637 14.9497 14.9497C13.637 16.2625 11.8565 17 10 17C8.14348 17 6.36301 16.2625 5.05025 14.9497C3.7375 13.637 3 11.8565 3 10V9H5ZM10 19V17" />
                      ) : (
                        <>
                          <path d="M10 1C9.20435 1 8.44129 1.31607 7.87868 1.87868C7.31607 2.44129 7 3.20435 7 4V10C7 10.7956 7.31607 11.5587 7.87868 12.1213C8.44129 12.6839 9.20435 13 10 13C10.7956 13 11.5587 12.6839 12.1213 12.1213C12.6839 11.5587 13 10.7956 13 10V4C13 3.20435 12.6839 2.44129 12.1213 1.87868C11.5587 1.31607 10.7956 1 10 1Z" />
                          <path
                            d="M2 2L18 18"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Guest Video */}
            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden group">
              {guestVideoEnabled ? (
                <div className="w-full h-full bg-gradient-to-br from-teal-900 to-cyan-900 flex items-center justify-center">
                  <div className="text-white text-6xl font-bold">SM</div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-2xl font-bold">SM</span>
                    </div>
                    <p className="text-white text-sm">Camera Off</p>
                  </div>
                </div>
              )}

              {/* Guest Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-green-500 rounded text-xs font-medium text-white">
                      GUEST
                    </div>
                    <span className="text-white font-medium">
                      Sarah Mitchell
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {guestAudioBars.map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${
                          guestAudioEnabled ? "bg-green-400" : "bg-gray-500"
                        }`}
                        style={{
                          height: guestAudioEnabled ? `${height}px` : "4px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Connection Quality */}
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded">
                <div className="w-1 h-3 bg-green-400 rounded"></div>
                <div className="w-1 h-3 bg-green-400 rounded"></div>
                <div className="w-1 h-3 bg-green-400 rounded"></div>
                <span className="text-white text-xs ml-1">Excellent</span>
              </div>
            </div>
          </div>

          {/* Recording Controls Panel */}
          <div className="bg-white rounded-xl border border-[#E5E5E0] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#37322F] mb-1">
                  Recording Controls
                </h3>
                <p className="text-sm text-[#9B9B98]">
                  Audio + Video recording enabled
                </p>
              </div>
              <div className="text-3xl font-bold text-[#37322F] font-mono">
                {formatTime(recordingTime)}
              </div>
            </div>

            {/* Waveform Visualization */}
            <div className="bg-[#F7F5F3] rounded-lg p-4 mb-6">
              <div className="flex items-end justify-center gap-1 h-16">
                {waveformBars.map((i) => {
                  const baseHeight = 20 + (i % 10) * 3;
                  const animatedHeight =
                    isRecording && !isPaused
                      ? baseHeight + (audioLevel * (i % 5)) / 10
                      : 20;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-[#37322F] rounded-full transition-all duration-150"
                      style={{
                        height: `${animatedHeight}%`,
                        opacity: isRecording && !isPaused ? 0.8 : 0.3,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={() => setIsRecording(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium shadow-lg transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <circle cx="10" cy="10" r="5" />
                  </svg>
                  Start Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#37322F] hover:bg-[#49423D] text-white rounded-full font-medium shadow-lg transition-all"
                  >
                    {isPaused ? (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="white"
                        >
                          <polygon
                            points="5 3 19 12 5 21 5 3"
                            transform="scale(0.7) translate(4,2)"
                          />
                        </svg>
                        Resume
                      </>
                    ) : (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="white"
                        >
                          <rect x="5" y="4" width="3" height="12" />
                          <rect x="12" y="4" width="3" height="12" />
                        </svg>
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsRecording(false);
                      setIsPaused(false);
                      setRecordingTime(0);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium shadow-lg transition-all"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="white"
                    >
                      <rect x="5" y="5" width="10" height="10" />
                    </svg>
                    Stop & Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button className="flex items-center gap-3 p-4 bg-white border border-[#E5E5E0] rounded-lg hover:border-[#37322F] hover:bg-[#F7F5F3] transition-all">
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

            <button className="flex items-center gap-3 p-4 bg-white border border-[#E5E5E0] rounded-lg hover:border-[#37322F] hover:bg-[#F7F5F3] transition-all">
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

            <button className="flex items-center gap-3 p-4 bg-white border border-[#E5E5E0] rounded-lg hover:border-[#37322F] hover:bg-[#F7F5F3] transition-all">
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
            <div className="bg-white rounded-lg border border-[#E5E5E0] p-5">
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

            <div className="bg-white rounded-lg border border-[#E5E5E0] p-5">
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

            <div className="bg-white rounded-lg border border-[#E5E5E0] p-5">
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === "all"
                        ? "bg-[#F7F5F3] text-[#37322F]"
                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter("published")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === "published"
                        ? "bg-[#F7F5F3] text-[#37322F]"
                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                    }`}
                  >
                    Published ({stats.published})
                  </button>
                  <button
                    onClick={() => setActiveFilter("draft")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === "draft"
                        ? "bg-[#F7F5F3] text-[#37322F]"
                        : "text-[#6B6B68] hover:bg-[#FAFAF9]"
                    }`}
                  >
                    Draft ({stats.draft})
                  </button>
                  <button
                    onClick={() => setActiveFilter("recording")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === "recording"
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
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            episode.status === "published"
                              ? "bg-[#DCFCE7] text-[#166534]"
                              : episode.status === "draft"
                                ? "bg-[#FEF3C7] text-[#854D0E]"
                                : "bg-[#DBEAFE] text-[#1E40AF]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              episode.status === "published"
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
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#37322F]">
                Create New Session
              </h2>
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

            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-[#37322F] mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g., Tech Talk Episode 1"
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-[#37322F] mb-2">
                  Session Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMeetingType("video")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      meetingType === "video"
                        ? "border-[#37322F] bg-[#F7F5F3]"
                        : "border-[#E5E5E0] hover:border-[#37322F]"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mx-auto mb-2"
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
                  </button>
                  <button
                    onClick={() => setMeetingType("audio")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      meetingType === "audio"
                        ? "border-[#37322F] bg-[#F7F5F3]"
                        : "border-[#E5E5E0] hover:border-[#37322F]"
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mx-auto mb-2"
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
                  </button>
                </div>
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-medium text-[#37322F] mb-2">
                  Max Participants
                </label>
                <select
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
                >
                  <option value={2}>2 Participants</option>
                  <option value={4}>4 Participants</option>
                  <option value={6}>6 Participants</option>
                  <option value={8}>8 Participants</option>
                  <option value={10}>10 Participants</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F7F5F3] transition-colors font-medium text-[#37322F]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                className="flex-1 px-4 py-2 bg-[#37322F] text-white rounded-lg hover:bg-[#49423D] transition-colors font-medium"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
