"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export default function MeetingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const meetingId = params.id as string;
  const title = searchParams.get("title") || "Untitled Session";
  const type = (searchParams.get("type") as "audio" | "video") || "video";
  const maxParticipants = parseInt(searchParams.get("max") || "2");

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(65);

  // Participant states
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "host",
      name: "You (Host)",
      isHost: true,
      videoEnabled: type === "video",
      audioEnabled: true,
    },
  ]);

  // Host controls
  const [hostVideoEnabled, setHostVideoEnabled] = useState(type === "video");
  const [hostAudioEnabled, setHostAudioEnabled] = useState(true);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; message: string; timestamp: Date }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");

  // Audio visualization
  const [waveformBars] = useState(() =>
    Array.from({ length: 60 }).map((_, i) => i),
  );

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setAudioLevel(Math.floor(Math.random() * 40) + 40);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleHostVideo = () => {
    setHostVideoEnabled(!hostVideoEnabled);
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "host" ? { ...p, videoEnabled: !hostVideoEnabled } : p,
      ),
    );
  };

  const toggleHostAudio = () => {
    setHostAudioEnabled(!hostAudioEnabled);
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "host" ? { ...p, audioEnabled: !hostAudioEnabled } : p,
      ),
    );
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/meeting/${meetingId}/join`;
    navigator.clipboard.writeText(inviteLink);
    setShowInviteLink(true);
    setTimeout(() => setShowInviteLink(false), 3000);
  };

  const handleEndMeeting = () => {
    if (confirm("Are you sure you want to end this meeting?")) {
      router.push("/dashboard");
    }
  };

  const handleSaveRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    alert(`Recording saved! Duration: ${formatTime(recordingTime)}`);
    setRecordingTime(0);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        {
          id: Date.now().toString(),
          sender: "You",
          message: newMessage,
          timestamp: new Date(),
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAF9] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E5E0] px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleEndMeeting}
                className="p-2 hover:bg-[#F7F5F3] rounded-lg transition-colors"
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
              <div>
                <h1 className="text-[#37322F] font-semibold text-lg">
                  {title}
                </h1>
                <p className="text-[#9B9B98] text-xs">
                  Meeting ID: {meetingId}
                </p>
              </div>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 font-mono text-sm font-medium">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-2 rounded-lg transition-colors ${showParticipants ? "bg-[#37322F] text-white" : "hover:bg-[#F7F5F3] text-[#37322F]"}`}
                title="Participants"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 10C11.6569 10 13 8.65685 13 7C13 5.34315 11.6569 4 10 4C8.34315 4 7 5.34315 7 7C7 8.65685 8.34315 10 10 10Z" />
                  <path d="M4 16C4 13.7909 5.79086 12 8 12H12C14.2091 12 16 13.7909 16 16V17H4V16Z" />
                </svg>
              </button>
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-2 px-4 py-2 bg-[#37322F] hover:bg-[#49423D] text-white rounded-lg transition-colors text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <path d="M8 2C7.2 2 6.5 2.3 6 2.9C5.5 3.4 5.2 4.1 5.2 4.9V6H10.8V4.9C10.8 4.1 10.5 3.4 10 2.9C9.5 2.3 8.8 2 8 2ZM4 6V4.9C4 3.8 4.4 2.7 5.2 1.9C6 1.1 7.1 0.7 8.2 0.7H7.8C8.9 0.7 10 1.1 10.8 1.9C11.6 2.7 12 3.8 12 4.9V6H13C13.5 6 14 6.2 14.4 6.6C14.8 7 15 7.5 15 8V13C15 13.5 14.8 14 14.4 14.4C14 14.8 13.5 15 13 15H3C2.5 15 2 14.8 1.6 14.4C1.2 14 1 13.5 1 13V8C1 7.5 1.2 7 1.6 6.6C2 6.2 2.5 6 3 6H4Z" />
                </svg>
                Invite
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto relative">
          {/* Video Container - Flex Layout */}
          <div className="flex gap-6 mb-6 flex-wrap">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex-1 min-w-[400px] relative aspect-video bg-gray-900 rounded-xl overflow-hidden group shadow-lg"
              >
                {participant.videoEnabled ? (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      participant.isHost
                        ? "from-purple-900 to-indigo-900"
                        : "from-teal-900 to-cyan-900"
                    } flex items-center justify-center`}
                  >
                    <div className="text-white text-6xl font-bold">
                      {participant.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className={`w-20 h-20 ${
                          participant.isHost ? "bg-purple-600" : "bg-teal-600"
                        } rounded-full flex items-center justify-center mx-auto mb-3`}
                      >
                        <span className="text-white text-2xl font-bold">
                          {participant.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white text-sm">Camera Off</p>
                    </div>
                  </div>
                )}

                {/* Participant Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {participant.isHost && (
                        <div className="px-2 py-1 bg-blue-500 rounded text-xs font-medium text-white">
                          HOST
                        </div>
                      )}
                      <span className="text-white font-medium">
                        {participant.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!participant.audioEnabled && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="red"
                        >
                          <path d="M8 2C7.46957 2 6.96086 2.21071 6.58579 2.58579C6.21071 2.96086 6 3.46957 6 4V8C6 8.53043 6.21071 9.03914 6.58579 9.41421C6.96086 9.78929 7.46957 10 8 10C8.53043 10 9.03914 9.78929 9.41421 9.41421C9.78929 9.03914 10 8.53043 10 8V4C10 3.46957 9.78929 2.96086 9.41421 2.58579C9.03914 2.21071 8.53043 2 8 2Z" />
                          <path d="M2 2L14 14" stroke="white" strokeWidth="2" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Participant Placeholder */}
            {participants.length < maxParticipants && (
              <div className="flex-1 min-w-[400px] relative aspect-video bg-white border-2 border-dashed border-[#E5E5E0] rounded-xl flex items-center justify-center group hover:border-[#37322F] transition-colors">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#F7F5F3] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M16 10V22M10 16H22"
                        stroke="#9B9B98"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p className="text-[#37322F] text-sm font-medium">
                    Waiting for guests...
                  </p>
                  <p className="text-[#9B9B98] text-xs mt-1">
                    {participants.length}/{maxParticipants} joined
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Waveform Visualization */}
          {isRecording && (
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 mb-6 max-w-4xl mx-auto shadow-sm">
              <h3 className="text-sm font-semibold text-[#37322F] mb-4">
                Audio Levels
              </h3>
              <div className="flex items-end justify-center gap-1 h-16">
                {waveformBars.map((i) => {
                  const baseHeight = 20 + (i % 10) * 3;
                  const animatedHeight = isPaused
                    ? 20
                    : baseHeight + (audioLevel * (i % 5)) / 10;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-[#37322F] rounded-full transition-all duration-150"
                      style={{
                        height: `${animatedHeight}%`,
                        opacity: isPaused ? 0.3 : 0.8,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Control Bar */}
        <div className="bg-white border-t border-[#E5E5E0] px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              {type === "video" && (
                <button
                  onClick={toggleHostVideo}
                  className={`p-4 rounded-full transition-all shadow-sm ${
                    hostVideoEnabled
                      ? "bg-[#F7F5F3] hover:bg-[#E5E5E0] text-[#37322F]"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title={
                    hostVideoEnabled ? "Turn off camera" : "Turn on camera"
                  }
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {hostVideoEnabled ? (
                      <path d="M23 7L16 12L23 17V7ZM15 5H3C1.9 5 1 5.9 1 7V17C1 18.1 1.9 19 3 19H15C16.1 19 17 18.1 17 17V7C17 5.9 16.1 5 15 5Z" />
                    ) : (
                      <>
                        <path d="M23 7L16 12L23 17V7ZM15 5H3C1.9 5 1 5.9 1 7V17C1 18.1 1.9 19 3 19H15C16.1 19 17 18.1 17 17V7C17 5.9 16.1 5 15 5Z" />
                        <path d="M2 2L22 22" stroke="white" strokeWidth="2" />
                      </>
                    )}
                  </svg>
                </button>
              )}

              <button
                onClick={toggleHostAudio}
                className={`p-4 rounded-full transition-all shadow-sm ${
                  hostAudioEnabled
                    ? "bg-[#F7F5F3] hover:bg-[#E5E5E0] text-[#37322F]"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
                title={hostAudioEnabled ? "Mute" : "Unmute"}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {hostAudioEnabled ? (
                    <path d="M12 2C11.2044 2 10.4413 2.31607 9.87868 2.87868C9.31607 3.44129 9 4.20435 9 5V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V5C15 4.20435 14.6839 3.44129 14.1213 2.87868C13.5587 2.31607 12.7956 2 12 2ZM19 10V12C19 14.1217 18.1571 16.1566 16.6569 17.6569C15.1566 19.1571 13.1217 20 11 20M5 10V12C5 14.1217 5.84285 16.1566 7.34315 17.6569C8.84344 19.1571 10.8783 20 13 20M12 20V23" />
                  ) : (
                    <>
                      <path d="M12 2C11.2044 2 10.4413 2.31607 9.87868 2.87868C9.31607 3.44129 9 4.20435 9 5V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V5C15 4.20435 14.6839 3.44129 14.1213 2.87868C13.5587 2.31607 12.7956 2 12 2Z" />
                      <path d="M2 2L22 22" stroke="white" strokeWidth="2" />
                    </>
                  )}
                </svg>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-all shadow-sm ${
                  isScreenSharing
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-[#F7F5F3] hover:bg-[#E5E5E0] text-[#37322F]"
                }`}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 18C20.5523 18 21 17.5523 21 17V7C21 6.44772 20.5523 6 20 6H4C3.44772 6 3 6.44772 3 7V17C3 17.5523 3.44772 18 4 18H9V19H8C7.44772 19 7 19.4477 7 20C7 20.5523 7.44772 21 8 21H16C16.5523 21 17 20.5523 17 20C17 19.4477 16.5523 19 16 19H15V18H20Z" />
                  <path
                    d="M12 14L16 10H13V7H11V10H8L12 14Z"
                    fill={isScreenSharing ? "white" : "#37322F"}
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-full transition-all shadow-sm relative ${
                  showChat
                    ? "bg-[#37322F] text-white"
                    : "bg-[#F7F5F3] hover:bg-[#E5E5E0] text-[#37322F]"
                }`}
                title="Chat"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" />
                </svg>
                {chatMessages.length > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-4 rounded-full transition-all shadow-sm ${
                  showSettings
                    ? "bg-[#37322F] text-white"
                    : "bg-[#F7F5F3] hover:bg-[#E5E5E0] text-[#37322F]"
                }`}
                title="Settings"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                </svg>
              </button>
            </div>

            {/* Center Recording Controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={() => setIsRecording(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all shadow-md"
                >
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                  Start Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-4 bg-[#F7F5F3] hover:bg-[#E5E5E0] rounded-full transition-all shadow-sm"
                  >
                    {isPaused ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#37322F"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    ) : (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#37322F"
                      >
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleSaveRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-all shadow-md"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="white"
                    >
                      <rect x="4" y="4" width="12" height="12" />
                    </svg>
                    Save Recording
                  </button>
                </>
              )}
            </div>

            {/* Right Controls */}
            <button
              onClick={handleEndMeeting}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              End Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-80 bg-white border-l border-[#E5E5E0] flex flex-col animate-slideIn">
          <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
            <h3 className="text-[#37322F] font-semibold">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-[#F7F5F3] rounded transition-colors"
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-[#9B9B98] text-sm mt-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#37322F]">
                      {msg.sender}
                    </span>
                    <span className="text-xs text-[#9B9B98]">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="bg-[#F7F5F3] rounded-lg p-3 text-sm text-[#37322F]">
                    {msg.message}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-[#E5E5E0]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-[#E5E5E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-[#37322F] hover:bg-[#49423D] disabled:bg-[#E5E5E0] disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                  <path d="M2 10L18 2L12 10H2ZM2 10L18 18L12 10H2Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="w-72 bg-white border-l border-[#E5E5E0] flex flex-col animate-slideIn">
          <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
            <h3 className="text-[#37322F] font-semibold">
              Participants ({participants.length}/{maxParticipants})
            </h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="p-1 hover:bg-[#F7F5F3] rounded transition-colors"
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

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F5F3] transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${participant.isHost ? "bg-purple-500" : "bg-teal-500"} text-white font-semibold`}
                >
                  {participant.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#37322F]">
                      {participant.name}
                    </span>
                    {participant.isHost && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {participant.videoEnabled ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#22c55e"
                      >
                        <path d="M23 7L16 12L23 17V7ZM15 5H3C1.9 5 1 5.9 1 7V17C1 18.1 1.9 19 3 19H15C16.1 19 17 18.1 17 17V7C17 5.9 16.1 5 15 5Z" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#9B9B98"
                      >
                        <path d="M23 7L16 12L23 17V7ZM15 5H3C1.9 5 1 5.9 1 7V17C1 18.1 1.9 19 3 19H15C16.1 19 17 18.1 17 17V7C17 5.9 16.1 5 15 5Z" />
                        <path d="M2 2L22 22" stroke="#ef4444" strokeWidth="2" />
                      </svg>
                    )}
                    {participant.audioEnabled ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#22c55e"
                      >
                        <path d="M12 2C11.2 2 10.4 2.3 9.9 2.9C9.3 3.4 9 4.2 9 5V12C9 12.8 9.3 13.6 9.9 14.1C10.4 14.7 11.2 15 12 15C12.8 15 13.6 14.7 14.1 14.1C14.7 13.6 15 12.8 15 12V5C15 4.2 14.7 3.4 14.1 2.9C13.6 2.3 12.8 2 12 2Z" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#ef4444"
                      >
                        <path d="M12 2C11.2 2 10.4 2.3 9.9 2.9C9.3 3.4 9 4.2 9 5V12C9 12.8 9.3 13.6 9.9 14.1C10.4 14.7 11.2 15 12 15C12.8 15 13.6 14.7 14.1 14.1C14.7 13.6 15 12.8 15 12V5C15 4.2 14.7 3.4 14.1 2.9C13.6 2.3 12.8 2 12 2Z" />
                        <path d="M2 2L22 22" stroke="white" strokeWidth="2" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Sidebar */}
      {showSettings && (
        <div className="w-80 bg-white border-l border-[#E5E5E0] flex flex-col animate-slideIn">
          <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
            <h3 className="text-[#37322F] font-semibold">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-[#F7F5F3] rounded transition-colors"
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

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[#37322F] mb-3">
                Video Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-lg">
                  <span className="text-sm text-[#37322F]">HD Quality</span>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </label>
                <label className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-lg">
                  <span className="text-sm text-[#37322F]">Mirror Video</span>
                  <input type="checkbox" className="w-4 h-4" />
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#37322F] mb-3">
                Audio Settings
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-[#F7F5F3] rounded-lg">
                  <label className="text-sm text-[#37322F] block mb-2">
                    Microphone Volume
                  </label>
                  <input
                    type="range"
                    className="w-full"
                    min="0"
                    max="100"
                    defaultValue="75"
                  />
                </div>
                <label className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-lg">
                  <span className="text-sm text-[#37322F]">
                    Noise Cancellation
                  </span>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </label>
                <label className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-lg">
                  <span className="text-sm text-[#37322F]">
                    Echo Cancellation
                  </span>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#37322F] mb-3">
                Recording Settings
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-[#F7F5F3] rounded-lg">
                  <label className="text-sm text-[#37322F] block mb-2">
                    Quality
                  </label>
                  <select className="w-full px-3 py-2 border border-[#E5E5E0] rounded text-sm">
                    <option>High (1080p)</option>
                    <option>Medium (720p)</option>
                    <option>Low (480p)</option>
                  </select>
                </div>
                <label className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-lg">
                  <span className="text-sm text-[#37322F]">Auto Save</span>
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Copied Toast */}
      {showInviteLink && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium z-50">
          ✓ Invite link copied to clipboard!
        </div>
      )}
    </div>
  );
}
