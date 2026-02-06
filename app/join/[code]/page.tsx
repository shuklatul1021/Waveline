"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, LogOut, Users, Loader2 } from "lucide-react";

interface MeetingInfo {
    id: string;
    title: string;
    type: string;
    status: string;
    maxParticipants: number;
    _count: { participants: number };
}

export default function JoinPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch meeting info
    useEffect(() => {
        async function fetchMeetingInfo() {
            try {
                const response = await fetch(`/api/meetings/join/${code}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setError("Meeting not found. Please check your invite link.");
                    } else {
                        setError("Failed to load meeting info");
                    }
                    return;
                }
                const data = await response.json();
                if (data.status === "ended") {
                    setError("This meeting has already ended.");
                    return;
                }
                setMeetingInfo(data);
            } catch (err) {
                setError("Failed to connect. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        fetchMeetingInfo();
    }, [code]);

    // Get camera/mic preview
    useEffect(() => {
        async function getMedia() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Could not access camera/mic:", err);
            }
        }
        if (meetingInfo && meetingInfo.type === "video") {
            getMedia();
        }
        return () => {
            localStream?.getTracks().forEach((track) => track.stop());
        };
    }, [meetingInfo]);

    // Toggle video preview
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = !videoEnabled;
            });
            setVideoEnabled(!videoEnabled);
        }
    };

    // Toggle audio preview
    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !audioEnabled;
            });
            setAudioEnabled(!audioEnabled);
        }
    };

    // Join meeting
    const handleJoin = async () => {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        setJoining(true);
        setError(null);

        try {
            const response = await fetch(`/api/meetings/join/${code}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "Failed to join meeting");
                return;
            }

            const data = await response.json();
            // Stop preview stream before navigating
            localStream?.getTracks().forEach((track) => track.stop());
            // Navigate to meeting room
            router.push(`/meeting/${data.meeting.id}?name=${encodeURIComponent(name)}&type=${data.meeting.type}`);
        } catch (err) {
            setError("Failed to join meeting. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#37322F] mx-auto mb-4" />
                    <p className="text-[#6B6B68]">Loading meeting info...</p>
                </div>
            </div>
        );
    }

    if (error && !meetingInfo) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-[#37322F] mb-2">Unable to Join</h1>
                    <p className="text-[#6B6B68] mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-[#37322F] text-white rounded-xl hover:bg-[#49423D] transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full">
                <div className="grid md:grid-cols-2">
                    {/* Video Preview */}
                    <div className="bg-gray-900 aspect-video md:aspect-auto md:min-h-[400px] relative">
                        {meetingInfo?.type === "video" ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover ${!videoEnabled ? "hidden" : ""}`}
                                />
                                {!videoEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 bg-[#37322F] rounded-full flex items-center justify-center">
                                            <span className="text-white text-3xl font-bold">
                                                {name ? name.substring(0, 2).toUpperCase() : "?"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* Video Controls */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                                    <button
                                        onClick={toggleAudio}
                                        className={`p-3 rounded-full transition-all ${audioEnabled
                                                ? "bg-white/20 hover:bg-white/30 text-white"
                                                : "bg-red-500 text-white"
                                            }`}
                                    >
                                        {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                                    </button>
                                    <button
                                        onClick={toggleVideo}
                                        className={`p-3 rounded-full transition-all ${videoEnabled
                                                ? "bg-white/20 hover:bg-white/30 text-white"
                                                : "bg-red-500 text-white"
                                            }`}
                                    >
                                        {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <Mic className="w-16 h-16 text-white/50 mx-auto mb-4" />
                                    <p className="text-white/70">Audio-only meeting</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Join Form */}
                    <div className="p-8">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-[#37322F] mb-2">
                                Join Meeting
                            </h1>
                            <h2 className="text-lg text-[#6B6B68]">{meetingInfo?.title}</h2>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#6B6B68] mb-6">
                            <Users size={16} />
                            <span>
                                {meetingInfo?._count.participants} / {meetingInfo?.maxParticipants} participants
                            </span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-[#37322F] mb-2">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#37322F] text-[#37322F]"
                                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleJoin}
                            disabled={joining || !name.trim()}
                            className="w-full py-4 bg-[#37322F] text-white rounded-xl font-semibold hover:bg-[#49423D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {joining ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                "Join Meeting"
                            )}
                        </button>

                        <p className="text-xs text-center text-[#9B9B98] mt-4">
                            By joining, you agree to our terms of service
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
