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
  Lock,
  Unlock,
  Square,
  CirclePlay,
  CirclePause,
  UserX,
  Maximize2,
  X,
  Send,
  Sliders,
  PhoneOff,
  Shield,
  LayoutGrid,
  MonitorSpeaker,
  ChevronUp,
  Copy,
  SmilePlus,
  MoreHorizontal,
  Settings,
  Clock,
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
    screenStream,
    isScreenSharing,
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
    startScreenShare,
    stopScreenShare,
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

  // Dismiss error after 8 seconds
  const [dismissedError, setDismissedError] = useState(false);
  useEffect(() => {
    if (error) {
      setDismissedError(false);
      const t = setTimeout(() => setDismissedError(true), 8000);
      return () => clearTimeout(t);
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
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("gallery");
  const [showReactions, setShowReactions] = useState(false);
  const [meetingElapsed, setMeetingElapsed] = useState(0);
  const initializingRef = React.useRef(false);

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

  // Initialize on mount - single initialization only
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      const stream = await getLocalStream(type === "video", true);
      if (stream && isMounted) {
        setIsInitialized(true);
        connect();
      } else if (isMounted) {
        // Even if media fails, still try to connect (audio-only fallback)
        setIsInitialized(true);
        connect();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Meeting elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
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

  const sendReaction = useCallback((emoji: string) => {
    const id = Date.now().toString();
    const x = Math.floor(Math.random() * 80) + 10;
    setReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }, []);

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

  // Calculate total participants count (deduplicate by peerId)
  const uniqueRemotePeerIds = new Set(
    remoteStreams.filter((s) => !s.isScreenShare).map((s) => s.peerId),
  );
  const participantCount = 1 + uniqueRemotePeerIds.size; // local + unique remote peers

  // Group remote streams: deduplicate so we show one VideoCard per peer (prefer video over audio-only)
  const deduplicatedRemoteStreams = (() => {
    const peerMap = new Map<string, (typeof remoteStreams)[number]>();
    for (const rs of remoteStreams) {
      if (rs.isScreenShare) continue; // Screen shares rendered separately
      const existing = peerMap.get(rs.peerId);
      // Prefer video stream over audio-only
      if (!existing || (rs.kind === "video" && existing.kind === "audio")) {
        peerMap.set(rs.peerId, rs);
      }
    }
    return Array.from(peerMap.values());
  })();

  // Separate screen share streams
  const screenShareStreams = remoteStreams.filter((s) => s.isScreenShare);

  // Active speaker (first remote video or null)
  const activeSpeaker =
    deduplicatedRemoteStreams.length > 0 ? deduplicatedRemoteStreams[0] : null;

  // Gallery grid layout classes
  const getGridClasses = () => {
    const total = participantCount;
    if (total === 1) return "grid-cols-1 max-w-3xl";
    if (total === 2) return "grid-cols-1 sm:grid-cols-2 max-w-5xl";
    if (total <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-5xl";
    if (total <= 6) return "grid-cols-2 sm:grid-cols-3 max-w-6xl";
    if (total <= 9) return "grid-cols-2 sm:grid-cols-3 max-w-7xl";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl";
  };

  return (
    <div className="flex h-screen bg-[#1A1714] overflow-hidden flex-col">
      {/* ====== TOP BAR - Zoom style minimal header ====== */}
      <header className="h-12 bg-[#2A2522] border-b border-[#37322F]/50 px-2 sm:px-4 flex items-center justify-between flex-shrink-0 z-50">
        {/* Left: Security + Meeting info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#37322F] rounded transition-colors"
            title="Security"
          >
            <Shield size={14} className="text-[#9B9B98]" />
          </button>
          <div className="h-4 w-px bg-[#37322F] hidden sm:block" />
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-medium font-mono">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Meeting title + ID */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
          <span className="text-[#E5E5E0] text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">
            {title}
          </span>
          <div className="h-3 w-px bg-[#37322F]" />
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-[#9B9B98]" />
            <span className="text-[#9B9B98] text-xs font-mono">
              {formatTime(meetingElapsed)}
            </span>
          </div>
        </div>

        {/* Right: View toggle + Settings */}
        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#37322F] rounded p-0.5 mr-2">
            <button
              onClick={() => setViewMode("gallery")}
              className={`p-1.5 rounded transition-colors ${viewMode === "gallery" ? "bg-[#49423D] text-[#E5E5E0]" : "text-[#9B9B98] hover:text-[#E5E5E0]"}`}
              title="Gallery View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("speaker")}
              className={`p-1.5 rounded transition-colors ${viewMode === "speaker" ? "bg-[#49423D] text-[#E5E5E0]" : "text-[#9B9B98] hover:text-[#E5E5E0]"}`}
              title="Speaker View"
            >
              <MonitorSpeaker size={14} />
            </button>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-[#37322F] rounded transition-colors text-[#9B9B98] hover:text-[#E5E5E0]"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* ====== MAIN CONTENT AREA ====== */}
      {/* Error Banner */}
      {error && !dismissedError && (
        <div className="bg-red-600/90 text-white px-4 py-2 flex items-center justify-between text-sm z-50">
          <span>⚠ {error}</span>
          <button
            onClick={() => setDismissedError(true)}
            className="p-1 hover:bg-red-700 rounded transition-colors ml-4"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* VIDEO AREA */}
        <div className="flex-1 flex flex-col relative">
          {/* Reaction Overlay */}
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-20 text-4xl"
                style={{
                  left: `${r.x}%`,
                  animation: "floatUp 3s ease-out forwards",
                }}
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
            <div className="absolute top-4 right-4 z-50">
              <PermissionRequests
                waitingPeers={waitingPeers}
                onApprove={approveJoin}
                onReject={rejectJoin}
              />
            </div>
          )}

          {/* ====== GALLERY VIEW ====== */}
          {viewMode === "gallery" && (
            <main className="flex-1 p-3 flex items-center justify-center">
              <div
                className={`w-full mx-auto grid gap-1.5 ${getGridClasses()}`}
                style={{
                  height: "100%",
                  gridAutoRows: "1fr",
                }}
              >
                {/* Local video tile */}
                {localStream && (
                  <div className="relative aspect-video min-h-0">
                    <VideoCard
                      stream={localStream}
                      name={userName}
                      isLocal={true}
                      isHost={isHost}
                      audioEnabled={hostAudioEnabled}
                      videoEnabled={hostVideoEnabled}
                      isSpotlighted={spotlightedId === "local"}
                      isHandRaised={handRaisedParticipants.has("local")}
                      variant="gallery"
                      onToggleAudio={toggleHostAudio}
                      onToggleVideo={toggleHostVideo}
                      onToggleSpotlight={() => toggleSpotlight("local")}
                    />
                  </div>
                )}

                {/* Remote video tiles */}
                {deduplicatedRemoteStreams.map((remoteStream) => {
                  const peer = peers.find((p) => p.id === remoteStream.peerId);
                  return (
                    <div
                      key={remoteStream.peerId}
                      className="relative aspect-video min-h-0"
                    >
                      <VideoCard
                        stream={remoteStream.stream}
                        name={
                          remoteStream.peerName || peer?.name || "Participant"
                        }
                        isLocal={false}
                        isHost={peer?.isHost}
                        videoEnabled={remoteStream.kind === "video"}
                        audioEnabled={true}
                        isSpotlighted={spotlightedId === remoteStream.peerId}
                        isHandRaised={handRaisedParticipants.has(
                          remoteStream.peerId,
                        )}
                        variant="gallery"
                        onToggleSpotlight={() =>
                          toggleSpotlight(remoteStream.peerId)
                        }
                      />
                    </div>
                  );
                })}

                {/* Remote screen shares */}
                {screenShareStreams.map((ss) => {
                  const peer = peers.find((p) => p.id === ss.peerId);
                  return (
                    <div
                      key={`screen-${ss.peerId}`}
                      className="relative aspect-video min-h-0 col-span-full"
                    >
                      <VideoCard
                        stream={ss.stream}
                        name={`${ss.peerName || peer?.name || "Participant"}'s screen`}
                        isLocal={false}
                        isHost={false}
                        videoEnabled={true}
                        audioEnabled={false}
                        isScreenShare={true}
                        variant="gallery"
                      />
                    </div>
                  );
                })}

                {/* Local screen share preview */}
                {isScreenSharing && screenStream && (
                  <div className="relative aspect-video min-h-0 col-span-full">
                    <VideoCard
                      stream={screenStream}
                      name="Your Screen"
                      isLocal={true}
                      isHost={false}
                      videoEnabled={true}
                      audioEnabled={false}
                      isScreenShare={true}
                      variant="gallery"
                    />
                  </div>
                )}
              </div>
            </main>
          )}

          {/* ====== SPEAKER VIEW ====== */}
          {viewMode === "speaker" && (
            <main className="flex-1 flex flex-col p-3 gap-2">
              {/* Screen share takes priority in speaker view */}
              {screenShareStreams.length > 0 || isScreenSharing ? (
                <div className="flex-1 min-h-0">
                  {screenShareStreams.length > 0 ? (
                    <VideoCard
                      stream={screenShareStreams[0].stream}
                      name={`${screenShareStreams[0].peerName || peers.find((p) => p.id === screenShareStreams[0].peerId)?.name || "Participant"}'s screen`}
                      isLocal={false}
                      isHost={false}
                      videoEnabled={true}
                      audioEnabled={false}
                      isScreenShare={true}
                      variant="speaker"
                    />
                  ) : screenStream ? (
                    <VideoCard
                      stream={screenStream}
                      name="Your Screen"
                      isLocal={true}
                      isHost={false}
                      videoEnabled={true}
                      audioEnabled={false}
                      isScreenShare={true}
                      variant="speaker"
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  {activeSpeaker ? (
                    <VideoCard
                      stream={activeSpeaker.stream}
                      name={
                        activeSpeaker.peerName ||
                        peers.find((p) => p.id === activeSpeaker.peerId)
                          ?.name ||
                        "Participant"
                      }
                      isLocal={false}
                      isHost={
                        peers.find((p) => p.id === activeSpeaker.peerId)?.isHost
                      }
                      videoEnabled={activeSpeaker.kind === "video"}
                      audioEnabled={true}
                      isSpotlighted={spotlightedId === activeSpeaker.peerId}
                      isHandRaised={handRaisedParticipants.has(
                        activeSpeaker.peerId,
                      )}
                      variant="speaker"
                      onToggleSpotlight={() =>
                        toggleSpotlight(activeSpeaker.peerId)
                      }
                    />
                  ) : localStream ? (
                    <VideoCard
                      stream={localStream}
                      name={userName}
                      isLocal={true}
                      isHost={isHost}
                      audioEnabled={hostAudioEnabled}
                      videoEnabled={hostVideoEnabled}
                      variant="speaker"
                      onToggleAudio={toggleHostAudio}
                      onToggleVideo={toggleHostVideo}
                    />
                  ) : null}
                </div>
              )}

              {/* Filmstrip at bottom */}
              {participantCount > 1 && (
                <div className="h-[100px] sm:h-[120px] flex-shrink-0 flex items-center gap-1.5 overflow-x-auto px-2 scrollbar-thin">
                  {/* Self view in filmstrip */}
                  {localStream && activeSpeaker && (
                    <div className="w-[120px] sm:w-[160px] h-[75px] sm:h-[100px] flex-shrink-0">
                      <VideoCard
                        stream={localStream}
                        name={userName}
                        isLocal={true}
                        isHost={isHost}
                        audioEnabled={hostAudioEnabled}
                        videoEnabled={hostVideoEnabled}
                        variant="filmstrip"
                        onToggleAudio={toggleHostAudio}
                        onToggleVideo={toggleHostVideo}
                      />
                    </div>
                  )}
                  {/* Other participants in filmstrip */}
                  {deduplicatedRemoteStreams
                    .filter((rs) => rs.peerId !== activeSpeaker?.peerId)
                    .map((remoteStream) => {
                      const peer = peers.find(
                        (p) => p.id === remoteStream.peerId,
                      );
                      return (
                        <div
                          key={remoteStream.peerId}
                          className="w-[120px] sm:w-[160px] h-[75px] sm:h-[100px] flex-shrink-0"
                        >
                          <VideoCard
                            stream={remoteStream.stream}
                            name={
                              remoteStream.peerName ||
                              peer?.name ||
                              "Participant"
                            }
                            isLocal={false}
                            isHost={peer?.isHost}
                            videoEnabled={remoteStream.kind === "video"}
                            audioEnabled={true}
                            variant="filmstrip"
                            onToggleSpotlight={() =>
                              toggleSpotlight(remoteStream.peerId)
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Floating self PiP when in speaker view with active speaker */}
              {activeSpeaker && localStream && participantCount <= 2 && (
                <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-6 z-30 shadow-2xl">
                  <VideoCard
                    stream={localStream}
                    name={userName}
                    isLocal={true}
                    isHost={isHost}
                    audioEnabled={hostAudioEnabled}
                    videoEnabled={hostVideoEnabled}
                    variant="pip"
                    onToggleAudio={toggleHostAudio}
                    onToggleVideo={toggleHostVideo}
                  />
                </div>
              )}
            </main>
          )}

          {/* Audio waveform during recording */}
          {isRecording && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#2A2522] border border-[#37322F] rounded-lg px-4 py-2 flex items-center gap-3 z-30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div className="flex items-end gap-0.5 h-6">
                {waveformBars.slice(0, 20).map((i) => {
                  const height = isPaused
                    ? 20
                    : 20 + (audioLevel * (i % 5)) / 10;
                  return (
                    <div
                      key={i}
                      className="w-0.5 bg-[#E5E5E0] rounded-full transition-all duration-150"
                      style={{
                        height: `${height}%`,
                        opacity: isPaused ? 0.3 : 0.7,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1 hover:bg-[#37322F] rounded transition-colors text-[#E5E5E0]"
                >
                  {isPaused ? (
                    <CirclePlay size={16} />
                  ) : (
                    <CirclePause size={16} />
                  )}
                </button>
                <button
                  onClick={handleSaveRecording}
                  className="p-1 hover:bg-[#37322F] rounded transition-colors text-red-400"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              </div>
            </div>
          )}

          {/* ====== BOTTOM TOOLBAR - Zoom style ====== */}
          <div className="h-14 sm:h-16 bg-[#2A2522] border-t border-[#37322F]/50 flex items-center justify-between px-2 sm:px-4 flex-shrink-0 z-50">
            {/* Left: Audio + Video Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Mute Button with dropdown */}
              <div className="flex items-center">
                <button
                  onClick={toggleHostAudio}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-l-lg transition-all ${
                    hostAudioEnabled
                      ? "bg-[#37322F] hover:bg-[#49423D] text-[#E5E5E0]"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  title={hostAudioEnabled ? "Mute" : "Unmute"}
                >
                  {hostAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  className={`px-1 py-2.5 rounded-r-lg border-l transition-all ${
                    hostAudioEnabled
                      ? "bg-[#37322F] hover:bg-[#49423D] text-[#9B9B98] border-[#49423D]"
                      : "bg-red-600 hover:bg-red-700 text-white/70 border-red-700"
                  }`}
                >
                  <ChevronUp size={12} />
                </button>
              </div>

              {/* Video Button with dropdown */}
              <div className="flex items-center ml-1">
                <button
                  onClick={toggleHostVideo}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-l-lg transition-all ${
                    hostVideoEnabled
                      ? "bg-[#37322F] hover:bg-[#49423D] text-[#E5E5E0]"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  title={hostVideoEnabled ? "Stop Video" : "Start Video"}
                >
                  {hostVideoEnabled ? (
                    <Video size={18} />
                  ) : (
                    <VideoOff size={18} />
                  )}
                </button>
                <button
                  className={`px-1 py-2.5 rounded-r-lg border-l transition-all ${
                    hostVideoEnabled
                      ? "bg-[#37322F] hover:bg-[#49423D] text-[#9B9B98] border-[#49423D]"
                      : "bg-red-600 hover:bg-red-700 text-white/70 border-red-700"
                  }`}
                >
                  <ChevronUp size={12} />
                </button>
              </div>
            </div>

            {/* Center: Action Buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Share Screen */}
              <button
                onClick={toggleScreenShare}
                className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                  isScreenSharing
                    ? "bg-[#49423D] text-[#E5E5E0]"
                    : "hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                }`}
                title="Share Screen"
              >
                <Monitor size={18} />
                <span className="text-[10px] mt-0.5 hidden sm:block">
                  Share
                </span>
              </button>

              {/* Reactions */}
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                    showReactions
                      ? "bg-[#49423D] text-[#E5E5E0]"
                      : "hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                  }`}
                  title="Reactions"
                >
                  <SmilePlus size={18} />
                  <span className="text-[10px] mt-0.5 hidden sm:block">
                    React
                  </span>
                </button>

                {/* Reactions Popup */}
                {showReactions && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#2A2522] border border-[#37322F] rounded-xl p-2 flex items-center gap-1 shadow-xl max-w-[calc(100vw-1rem)]">
                    {["👏", "👍", "❤️", "😂", "😮", "🔥", "🎉", "✋"].map(
                      (emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            sendReaction(emoji);
                            setShowReactions(false);
                          }}
                          className="w-9 h-9 flex items-center justify-center text-xl hover:bg-[#37322F] rounded-lg transition-all hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ),
                    )}
                    <div className="h-6 w-px bg-[#37322F] mx-1" />
                    <button
                      onClick={toggleHandRaise}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                        handRaisedParticipants.has("host")
                          ? "bg-amber-500/20 text-amber-400"
                          : "hover:bg-[#37322F] text-[#9B9B98]"
                      }`}
                      title="Raise Hand"
                    >
                      <Hand size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Record */}
              <button
                onClick={() =>
                  isRecording ? handleSaveRecording() : setIsRecording(true)
                }
                className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                  isRecording
                    ? "bg-red-600/20 text-red-400"
                    : "hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                }`}
                title={isRecording ? "Stop Recording" : "Record"}
              >
                {isRecording ? (
                  <Square size={18} fill="currentColor" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-current flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                )}
                <span className="text-[10px] mt-0.5 hidden sm:block">
                  {isRecording ? "Stop" : "Record"}
                </span>
              </button>

              <div className="h-8 w-px bg-[#37322F] mx-0.5 sm:mx-1" />

              {/* Participants */}
              <button
                onClick={() => {
                  setShowParticipants(!showParticipants);
                  if (showChat) setShowChat(false);
                  if (showHostControls) setShowHostControls(false);
                }}
                className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all relative ${
                  showParticipants
                    ? "bg-[#49423D] text-[#E5E5E0]"
                    : "hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                }`}
                title="Participants"
              >
                <Users size={18} />
                <span className="text-[10px] mt-0.5 hidden sm:block">
                  Participants{" "}
                  <span className="font-mono">({participantCount})</span>
                </span>
              </button>

              {/* Chat */}
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  if (showParticipants) setShowParticipants(false);
                  if (showHostControls) setShowHostControls(false);
                }}
                className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all relative ${
                  showChat
                    ? "bg-[#49423D] text-[#E5E5E0]"
                    : "hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                }`}
                title="Chat"
              >
                <MessageSquare size={18} />
                <span className="text-[10px] mt-0.5 hidden sm:block">Chat</span>
                {chatMessages.length > 0 && !showChat && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              {/* Host Controls */}
              {isHost && (
                <button
                  onClick={() => {
                    setShowHostControls(!showHostControls);
                    if (showChat) setShowChat(false);
                    if (showParticipants) setShowParticipants(false);
                  }}
                  className={`flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                    showHostControls
                      ? "bg-[#49423D] text-[#E5E5E0]"
                      : "hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                  }`}
                  title="Host Controls"
                >
                  <Sliders size={18} />
                  <span className="text-[10px] mt-0.5 hidden sm:block">
                    More
                  </span>
                </button>
              )}

              {/* Invite */}
              <button
                onClick={copyInviteLink}
                className="flex flex-col items-center px-2 sm:px-3 py-1.5 rounded-lg transition-all hover:bg-[#37322F] text-[#9B9B98] hover:text-[#E5E5E0]"
                title="Invite"
              >
                <Copy size={18} />
                <span className="text-[10px] mt-0.5 hidden sm:block">
                  Invite
                </span>
              </button>
            </div>

            {/* Right: End Call Button */}
            <button
              onClick={handleEndMeeting}
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm"
            >
              <PhoneOff size={16} />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>

        {/* ====== SIDE PANELS (Chat / Participants / Host Controls) ====== */}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-full sm:w-80 bg-[#2A2522] border-l border-[#37322F]/50 flex flex-col flex-shrink-0 animate-slideIn absolute sm:static inset-0 sm:inset-auto z-40 sm:z-auto">
            <div className="h-12 px-4 border-b border-[#37322F]/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-[#E5E5E0] font-semibold text-sm">
                In-Meeting Chat
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-[#37322F] rounded transition-colors text-[#9B9B98]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-[#9B9B98] text-xs mt-12 px-4">
                  <MessageSquare
                    size={32}
                    className="mx-auto mb-3 opacity-30"
                  />
                  <p>No messages yet</p>
                  <p className="text-[10px] mt-1 opacity-70">
                    Messages are only visible to participants in this meeting.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#E5E5E0]">
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-[#9B9B98]">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[#E5E5E0]/80 text-sm pl-0">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#37322F]/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type message here..."
                  className="flex-1 px-3 py-2 bg-[#37322F] border border-[#49423D] rounded-lg text-sm text-[#E5E5E0] placeholder-[#9B9B98] focus:outline-none focus:ring-1 focus:ring-[#49423D]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 bg-[#37322F] hover:bg-[#49423D] disabled:opacity-30 disabled:cursor-not-allowed text-[#E5E5E0] rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-full sm:w-80 bg-[#2A2522] border-l border-[#37322F]/50 flex flex-col flex-shrink-0 animate-slideIn absolute sm:static inset-0 sm:inset-auto z-40 sm:z-auto">
            <div className="h-12 px-4 border-b border-[#37322F]/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-[#E5E5E0] font-semibold text-sm">
                Participants ({participantCount})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 hover:bg-[#37322F] rounded transition-colors text-[#9B9B98]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Invite Section */}
            <div className="px-4 py-3 border-b border-[#37322F]/50">
              <button
                onClick={copyInviteLink}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#37322F] hover:bg-[#49423D] text-[#E5E5E0] rounded-lg transition-colors text-sm"
              >
                <Copy size={14} />
                Copy Invite Link
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Host Section */}
              <div className="px-4 py-2">
                <p className="text-[10px] font-semibold text-[#9B9B98] uppercase tracking-wider mb-2">
                  Host
                </p>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-[#49423D] flex items-center justify-center text-[#E5E5E0] text-xs font-semibold">
                    {userName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[#E5E5E0] font-medium truncate block">
                      {userName} (You)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hostAudioEnabled ? (
                      <Mic size={14} className="text-[#9B9B98]" />
                    ) : (
                      <MicOff size={14} className="text-red-400" />
                    )}
                    {hostVideoEnabled ? (
                      <Video size={14} className="text-[#9B9B98]" />
                    ) : (
                      <VideoOff size={14} className="text-red-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Participants Section */}
              {peers.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-[#9B9B98] uppercase tracking-wider mb-2">
                    Participants
                  </p>
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center gap-3 py-2 group/peer"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#37322F] flex items-center justify-center text-[#E5E5E0] text-xs font-semibold">
                        {peer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#E5E5E0] font-medium truncate block">
                          {peer.name}
                          {peer.isHost && (
                            <span className="ml-1.5 text-[10px] text-[#9B9B98]">
                              (Host)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mic size={14} className="text-[#9B9B98]" />
                        <Video size={14} className="text-[#9B9B98]" />
                        {isHost && (
                          <button className="p-1 opacity-0 group-hover/peer:opacity-100 hover:bg-[#37322F] rounded transition-all text-[#9B9B98]">
                            <MoreHorizontal size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Host Controls Panel */}
        {showHostControls && (
          <div className="w-full sm:w-80 bg-[#2A2522] border-l border-[#37322F]/50 flex flex-col flex-shrink-0 animate-slideIn absolute sm:static inset-0 sm:inset-auto z-40 sm:z-auto">
            <div className="h-12 px-4 border-b border-[#37322F]/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#E5E5E0]" />
                <h3 className="text-[#E5E5E0] font-semibold text-sm">
                  Host Controls
                </h3>
              </div>
              <button
                onClick={() => setShowHostControls(false)}
                className="p-1 hover:bg-[#37322F] rounded transition-colors text-[#9B9B98]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Meeting Controls */}
              <div>
                <p className="text-[10px] font-semibold text-[#9B9B98] uppercase tracking-wider mb-3">
                  Meeting Controls
                </p>

                <div className="space-y-2">
                  <button
                    onClick={toggleMeetingLock}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      isMeetingLocked
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        : "bg-[#37322F] hover:bg-[#49423D] text-[#E5E5E0] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isMeetingLocked ? (
                        <Lock size={16} />
                      ) : (
                        <Unlock size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {isMeetingLocked ? "Meeting Locked" : "Lock Meeting"}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-5 rounded-full transition-colors relative ${
                        isMeetingLocked ? "bg-amber-500" : "bg-[#49423D]"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                          isMeetingLocked ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </div>
                  </button>

                  <button
                    onClick={muteAll}
                    className="w-full flex items-center gap-3 p-3 bg-[#37322F] hover:bg-[#49423D] text-[#E5E5E0] rounded-lg transition-all border border-transparent"
                  >
                    <MicOff size={16} className="text-red-400" />
                    <span className="text-sm font-medium">
                      Mute All Participants
                    </span>
                  </button>

                  <button
                    onClick={stopAllCameras}
                    className="w-full flex items-center gap-3 p-3 bg-[#37322F] hover:bg-[#49423D] text-[#E5E5E0] rounded-lg transition-all border border-transparent"
                  >
                    <VideoOff size={16} className="text-red-400" />
                    <span className="text-sm font-medium">
                      Stop All Cameras
                    </span>
                  </button>
                </div>
              </div>

              {/* Participant Management */}
              <div>
                <p className="text-[10px] font-semibold text-[#9B9B98] uppercase tracking-wider mb-3">
                  Manage Participants
                </p>
                <div className="space-y-1 bg-[#37322F]/50 rounded-lg overflow-hidden">
                  {peers
                    .filter((p) => !p.isHost)
                    .map((peer) => (
                      <div
                        key={peer.id}
                        className="flex items-center justify-between p-3 hover:bg-[#37322F] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#49423D] rounded-full flex items-center justify-center text-[10px] font-semibold text-[#E5E5E0]">
                            {peer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm text-[#E5E5E0]">
                            {peer.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleSpotlight(peer.id)}
                            className={`p-1.5 rounded transition-all ${
                              spotlightedId === peer.id
                                ? "bg-[#49423D] text-[#E5E5E0]"
                                : "text-[#9B9B98] hover:bg-[#49423D] hover:text-[#E5E5E0]"
                            }`}
                            title="Spotlight"
                          >
                            <Maximize2 size={12} />
                          </button>
                          <button
                            className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove"
                          >
                            <UserX size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {peers.filter((p) => !p.isHost).length === 0 && (
                    <p className="p-4 text-center text-xs text-[#9B9B98]">
                      No participants to manage
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Host info footer */}
            <div className="p-4 border-t border-[#37322F]/50">
              <div className="flex items-center gap-3 p-3 bg-[#37322F] rounded-lg">
                <Shield size={16} className="text-[#9B9B98]" />
                <div>
                  <p className="text-[11px] font-semibold text-[#E5E5E0]">
                    Host privileges active
                  </p>
                  <p className="text-[10px] text-[#9B9B98]">
                    Full meeting control enabled
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====== SETTINGS MODAL ====== */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[500px] mx-4 max-h-[80vh] bg-[#2A2522] rounded-xl border border-[#37322F] shadow-2xl overflow-hidden">
            <div className="h-12 px-5 border-b border-[#37322F] flex items-center justify-between">
              <h3 className="text-[#E5E5E0] font-semibold text-sm">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-[#37322F] rounded transition-colors text-[#9B9B98]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              <div>
                <h4 className="text-[11px] font-bold text-[#9B9B98] uppercase tracking-wider mb-3">
                  Video
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-[#37322F] rounded-lg cursor-pointer hover:bg-[#49423D] transition-colors">
                    <span className="text-sm text-[#E5E5E0]">HD Quality</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#49423D]"
                      defaultChecked
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-[#37322F] rounded-lg cursor-pointer hover:bg-[#49423D] transition-colors">
                    <span className="text-sm text-[#E5E5E0]">
                      Mirror my video
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#49423D]"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#9B9B98] uppercase tracking-wider mb-3">
                  Audio
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-[#37322F] rounded-lg">
                    <label className="text-sm text-[#E5E5E0] block mb-2">
                      Microphone Volume
                    </label>
                    <input
                      type="range"
                      className="w-full accent-[#49423D]"
                      min="0"
                      max="100"
                      defaultValue="75"
                    />
                  </div>
                  <label className="flex items-center justify-between p-3 bg-[#37322F] rounded-lg cursor-pointer hover:bg-[#49423D] transition-colors">
                    <span className="text-sm text-[#E5E5E0]">
                      Noise Cancellation
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#49423D]"
                      defaultChecked
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-[#37322F] rounded-lg cursor-pointer hover:bg-[#49423D] transition-colors">
                    <span className="text-sm text-[#E5E5E0]">
                      Echo Cancellation
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#49423D]"
                      defaultChecked
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#9B9B98] uppercase tracking-wider mb-3">
                  Recording
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-[#37322F] rounded-lg">
                    <label className="text-sm text-[#E5E5E0] block mb-2">
                      Quality
                    </label>
                    <select className="w-full px-3 py-2 bg-[#2A2522] border border-[#49423D] rounded-lg text-sm text-[#E5E5E0]">
                      <option>High (1080p)</option>
                      <option>Medium (720p)</option>
                      <option>Low (480p)</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between p-3 bg-[#37322F] rounded-lg cursor-pointer hover:bg-[#49423D] transition-colors">
                    <span className="text-sm text-[#E5E5E0]">Auto Save</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#49423D]"
                      defaultChecked
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Copied Toast */}
      {showInviteLink && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#37322F] text-[#E5E5E0] px-5 py-2.5 rounded-lg shadow-xl font-medium text-sm z-[100] border border-[#49423D]">
          ✓ Invite link copied to clipboard!
        </div>
      )}
    </div>
  );
}
