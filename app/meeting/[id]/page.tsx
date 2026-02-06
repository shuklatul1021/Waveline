"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Users,
  MessageSquare,
  LogOut,
  Lock,
  Unlock,
  Info,
  Square,
  CirclePlay,
  CirclePause,
  UserX,
  Maximize2,
  X,
  Send,
  Sliders,
} from "lucide-react";
import { useMediasoup } from "@/hooks/useMediasoup";
import { VideoCard } from "@/components/VideoCard";
import {
  PermissionRequests,
  WaitingRoom,
} from "@/components/PermissionRequests";

export default function MeetingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const meetingId = params.id as string;
  const title = searchParams.get("title") || "Untitled Session";
  const type = (searchParams.get("type") as "audio" | "video") || "video";
  const maxParticipants = parseInt(searchParams.get("max") || "10");
  const isHostParam = searchParams.get("host") === "true";
  const userName = searchParams.get("name") || "Guest";

  // Mediasoup hook for real video/audio
  const {
    isConnected,
    isJoined,
    isWaiting,
    isRejected,
    isHost,
    localStream,
    remoteStreams,
    peers,
    waitingPeers,
    error,
    connect,
    joinRoom,
    leaveRoom,
    getLocalStream,
    startProducing,
    toggleVideo,
    toggleAudio,
    approveJoin,
    rejectJoin,
  } = useMediasoup({
    roomId: meetingId,
    userName: userName,
    isHost: isHostParam,
    autoJoin: false,
  });

  // Show error if media access fails
  useEffect(() => {
    if (error) {
      console.error("Media error:", error);
    }
  }, [error]);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(65);

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

  // Interaction states
  const [handRaisedParticipants, setHandRaisedParticipants] = useState<
    Set<string>
  >(new Set());
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [spotlightedId, setSpotlightedId] = useState<string | null>(null);
  const [showHostControls, setShowHostControls] = useState(false);
  const [reactions, setReactions] = useState<
    { id: string; emoji: string; x: number }[]
  >([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Meeting data from API
  const [meetingData, setMeetingData] = useState<{
    inviteCode?: string;
    status?: string;
  } | null>(null);

  // Audio visualization
  const [waveformBars] = useState(() =>
    Array.from({ length: 60 }).map((_, i) => i),
  );

  // Initialize media and join room
  const initializeMedia = useCallback(async () => {
    if (isInitialized) return;

    const stream = await getLocalStream(type === "video", true);
    if (stream) {
      setIsInitialized(true);
      connect();
    }
  }, [getLocalStream, type, connect, isInitialized]);

  // Auto-join when connected
  useEffect(() => {
    if (isConnected && !isJoined && !isWaiting && isInitialized) {
      joinRoom(isHostParam);
    }
  }, [isConnected, isJoined, isWaiting, isInitialized, joinRoom, isHostParam]);

  // Start producing after joined
  useEffect(() => {
    if (isJoined && localStream) {
      startProducing();
    }
  }, [isJoined, localStream, startProducing]);

  // Initialize on mount
  useEffect(() => {
    initializeMedia();
  }, [initializeMedia]);

  // Fetch meeting data
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeetingData(data);
        }
      } catch (error) {
        console.error("Failed to fetch meeting:", error);
      }
    }
    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);

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

  const toggleHostVideo = async () => {
    toggleVideo(!hostVideoEnabled);
    setHostVideoEnabled(!hostVideoEnabled);
  };

  const toggleHostAudio = async () => {
    toggleAudio(!hostAudioEnabled);
    setHostAudioEnabled(!hostAudioEnabled);
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const copyInviteLink = () => {
    const inviteCode = meetingData?.inviteCode;
    const inviteLink = inviteCode
      ? `${window.location.origin}/join/${inviteCode}`
      : `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(inviteLink);
    setShowInviteLink(true);
    setTimeout(() => setShowInviteLink(false), 3000);
  };

  const handleEndMeeting = () => {
    if (confirm("Are you sure you want to leave this meeting?")) {
      leaveRoom();
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

  const toggleHandRaise = () => {
    setHandRaisedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has("host")) next.delete("host");
      else next.add("host");
      return next;
    });
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now().toString();
    const x = Math.floor(Math.random() * 80) + 10;
    setReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const muteAll = () => {
    // TODO: Implement server-side mute all via WebSocket
    alert("Mute all request sent.");
  };

  const stopAllCameras = () => {
    // TODO: Implement server-side disable cameras via WebSocket
    alert("Stop cameras request sent.");
  };

  const toggleMeetingLock = () => {
    setIsMeetingLocked(!isMeetingLocked);
  };

  const toggleSpotlight = (id: string) => {
    setSpotlightedId(spotlightedId === id ? null : id);
  };

  // Calculate total participants count
  const participantCount = 1 + remoteStreams.length; // local + remote

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
        <main className="flex-1 px-4 py-2 overflow-auto relative flex flex-col items-center justify-center">
          {/* Reaction Overlay */}
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-0 text-4xl animate-float"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Waiting Room Modal */}
          <WaitingRoom
            meetingTitle={title}
            isWaiting={isWaiting}
            isRejected={isRejected}
            onCancel={() => router.push("/dashboard")}
          />

          {/* Permission Requests for Host */}
          {isHost && waitingPeers.length > 0 && (
            <PermissionRequests
              waitingPeers={waitingPeers}
              onApprove={approveJoin}
              onReject={rejectJoin}
            />
          )}

          {/* Video Container - Dynamic Grid Layout */}
          <div
            className={`w-full mx-auto grid gap-6 ${
              participantCount === 1
                ? "max-w-xl"
                : participantCount === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
                  : participantCount <= 4
                    ? "grid-cols-2 max-w-6xl"
                    : "grid-cols-2 lg:grid-cols-3 max-w-7xl"
            }`}
          >
            {localStream && (
              <VideoCard
                stream={localStream}
                name={userName}
                isLocal={true}
                isHost={isHost}
                audioEnabled={hostAudioEnabled}
                videoEnabled={hostVideoEnabled}
                isSpotlighted={spotlightedId === "local"}
                isHandRaised={handRaisedParticipants.has("local")}
                onToggleAudio={toggleHostAudio}
                onToggleVideo={toggleHostVideo}
                onToggleSpotlight={() => toggleSpotlight("local")}
              />
            )}

            {remoteStreams.map((remoteStream) => {
              const peer = peers.find((p) => p.id === remoteStream.peerId);
              return (
                <VideoCard
                  key={remoteStream.peerId}
                  stream={remoteStream.stream}
                  name={remoteStream.peerName || peer?.name || "Participant"}
                  isLocal={false}
                  isHost={peer?.isHost}
                  videoEnabled={remoteStream.kind === "video"}
                  audioEnabled={remoteStream.kind === "audio"}
                  isSpotlighted={spotlightedId === remoteStream.peerId}
                  isHandRaised={handRaisedParticipants.has(remoteStream.peerId)}
                  onToggleSpotlight={() => toggleSpotlight(remoteStream.peerId)}
                />
              );
            })}
          </div>

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
        <div className="bg-white border-t border-gray-200 px-6 py-5 shadow-lg z-50">
          <div className="flex items-center justify-between max-w-[1400px] mx-auto gap-8">
            <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200">
              <button
                onClick={toggleHostAudio}
                className={`p-3.5 rounded-xl transition-all ${hostAudioEnabled ? "bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-100" : "bg-red-500 text-white shadow-lg shadow-red-200"}`}
                title={hostAudioEnabled ? "Mute" : "Unmute"}
              >
                {hostAudioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
              <button
                onClick={toggleHostVideo}
                className={`p-3.5 rounded-xl transition-all ${hostVideoEnabled ? "bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-100" : "bg-red-500 text-white shadow-lg shadow-red-200"}`}
                title={hostVideoEnabled ? "Camera Off" : "Camera On"}
              >
                {hostVideoEnabled ? (
                  <Video size={22} />
                ) : (
                  <VideoOff size={22} />
                )}
              </button>
              <button
                onClick={toggleScreenShare}
                className={`p-3.5 rounded-xl transition-all ${isScreenSharing ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-100"}`}
                title="Share Screen"
              >
                <Monitor size={22} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200">
              <button
                onClick={toggleHandRaise}
                className={`p-3.5 rounded-xl transition-all ${handRaisedParticipants.has("host") ? "bg-amber-400 text-amber-900 shadow-lg shadow-amber-100" : "bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-100"}`}
                title="Raise Hand"
              >
                <Hand
                  size={22}
                  className={
                    handRaisedParticipants.has("host") ? "fill-current" : ""
                  }
                />
              </button>
              <div className="h-8 w-px bg-gray-300 mx-1"></div>
              <div className="flex items-center gap-1">
                {["👏", "❤️", "🔥", "😂", "😮"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="p-2.5 text-lg hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={() => setIsRecording(true)}
                  className="group flex items-center gap-3 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-100 hover:-translate-y-0.5"
                >
                  <div className="w-3.5 h-3.5 bg-white rounded-full animate-pulse group-hover:scale-125 transition-transform" />
                  Record Session
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-2xl border border-red-100">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="px-4 py-2.5 bg-white text-red-600 rounded-xl font-bold shadow-sm hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    {isPaused ? (
                      <CirclePlay size={18} />
                    ) : (
                      <CirclePause size={18} />
                    )}
                    {isPaused ? " Resume" : " Pause"}
                  </button>
                  <button
                    onClick={handleSaveRecording}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    <Square size={16} fill="currentColor" />
                    Stop & Save
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-3.5 rounded-xl transition-all relative ${showParticipants ? "bg-gray-800 text-white shadow-inner" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title="Participants"
              >
                <Users size={22} />
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-3.5 rounded-xl transition-all relative ${showChat ? "bg-gray-800 text-white shadow-inner" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title="Chat"
              >
                <MessageSquare size={22} />
                {chatMessages.length > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {chatMessages.length}
                  </span>
                )}
              </button>
              <div className="h-8 w-px bg-gray-200 mx-1"></div>

              <button
                onClick={() => setShowHostControls(!showHostControls)}
                className={`p-3.5 rounded-xl transition-all ${showHostControls ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                title="Host Controls"
              >
                <Sliders size={22} />
              </button>
            </div>
            <button
              onClick={handleEndMeeting}
              className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-100 flex items-center gap-2 group"
            >
              <LogOut size={20} strokeWidth={3} />
              End Session
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
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showParticipants && (
        <div className="w-72 bg-white border-l border-[#E5E5E0] flex flex-col animate-slideIn">
          <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
            <h3 className="text-[#37322F] font-semibold">
              Participants ({participantCount}/{maxParticipants})
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
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F5F3] transition-colors">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isHost ? "bg-purple-500" : "bg-teal-500"} text-white font-semibold`}
              >
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#37322F]">
                    {userName}
                  </span>
                  {isHost && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      Host
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {hostVideoEnabled ? (
                    <Video size={14} className="text-green-500" />
                  ) : (
                    <VideoOff size={14} className="text-red-500" />
                  )}
                  {hostAudioEnabled ? (
                    <Mic size={14} className="text-green-500" />
                  ) : (
                    <MicOff size={14} className="text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Remote Participants */}
            {peers.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F5F3] transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${peer.isHost ? "bg-purple-500" : "bg-teal-500"} text-white font-semibold`}
                >
                  {peer.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#37322F]">
                      {peer.name}
                    </span>
                    {peer.isHost && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Video size={14} className="text-green-500" />
                    <Mic size={14} className="text-green-500" />
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

      {/* Host Controls Sidebar */}
      {showHostControls && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col animate-slideIn shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Sliders size={18} strokeWidth={2.5} />
              </div>
              <h3 className="text-gray-900 font-bold">Host Controls</h3>
            </div>
            <button
              onClick={() => setShowHostControls(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                Meeting Management
              </h4>

              <button
                onClick={toggleMeetingLock}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${isMeetingLocked ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isMeetingLocked ? "bg-amber-100" : "bg-white shadow-sm"}`}
                  >
                    {isMeetingLocked ? (
                      <Lock size={20} />
                    ) : (
                      <Unlock size={20} />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Lock Meeting</p>
                    <p className="text-[10px] opacity-70">
                      Prevent new guests from joining
                    </p>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative ${isMeetingLocked ? "bg-amber-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMeetingLocked ? "right-1" : "left-1"}`}
                  ></div>
                </div>
              </button>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={muteAll}
                  className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 rounded-2xl transition-all group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <MicOff size={20} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Mute All</p>
                    <p className="text-[10px] text-red-600/70">
                      Mute every participant&apos;s mic
                    </p>
                  </div>
                </button>

                <button
                  onClick={stopAllCameras}
                  className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-700 rounded-2xl transition-all group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <VideoOff size={20} className="text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Disable All Cameras</p>
                    <p className="text-[10px] text-orange-600/70">
                      Turn off video for everyone
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                Participant Settings
              </h4>
              <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100 divide-y divide-gray-100">
                {peers
                  .filter((p) => !p.isHost)
                  .map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                          {peer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {peer.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSpotlight(peer.id)}
                          className={`p-2 rounded-lg transition-all ${spotlightedId === peer.id ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-white hover:bg-gray-100 text-gray-400 border border-gray-100"}`}
                          title="Spotlight"
                        >
                          <Maximize2 size={14} strokeWidth={2.5} />
                        </button>
                        <button className="p-2 bg-white hover:bg-red-50 text-red-400 rounded-lg transition-all border border-gray-100 hover:border-red-100">
                          <UserX size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                {peers.filter((p) => !p.isHost).length === 0 && (
                  <p className="p-4 text-center text-xs text-gray-500 italic">
                    No participants to manage
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 bg-gray-50/50 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  Host privileges active
                </p>
                <p className="text-[10px] opacity-80 mt-0.5">
                  You can moderate the session.
                </p>
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
