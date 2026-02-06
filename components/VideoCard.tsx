"use client";

import React, { useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Crown,
  Pin,
  PinOff,
} from "lucide-react";

interface VideoCardProps {
  stream: MediaStream | null;
  name: string;
  isHost?: boolean;
  isLocal?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  isHandRaised?: boolean;
  isSpotlighted?: boolean;
  onToggleSpotlight?: () => void;
  onToggleVideo?: () => void;
  onToggleAudio?: () => void;
  className?: string;
}

export function VideoCard({
  stream,
  name,
  isHost = false,
  isLocal = false,
  videoEnabled = true,
  audioEnabled = true,
  isHandRaised = false,
  isSpotlighted = false,
  onToggleSpotlight,
  onToggleVideo,
  onToggleAudio,
  className = "",
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div
      className={`relative aspect-video bg-gray-900 rounded-2xl overflow-hidden group shadow-2xl transition-all duration-500 ${
        isSpotlighted ? "ring-4 ring-blue-500 scale-105 z-10" : ""
      } ${className}`}
    >
      {/* Video Element */}
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-center">
            <div
              className={`w-20 h-20 ${
                isHost ? "bg-indigo-600" : "bg-gray-700"
              } rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/5 shadow-xl`}
            >
              <span className="text-white text-3xl font-bold">{initials}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Camera Off</p>
          </div>
        </div>
      )}

      {/* Local controls overlay - only show on hover for local */}
      {isLocal && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleVideo}
            className={`p-2 rounded-lg transition-all ${
              videoEnabled
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg transition-all ${
              audioEnabled
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
        </div>
      )}

      {/* Spotlight button - show on hover */}
      {onToggleSpotlight && (
        <button
          onClick={onToggleSpotlight}
          className="absolute top-4 left-4 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          title={isSpotlighted ? "Remove spotlight" : "Spotlight"}
        >
          {isSpotlighted ? <PinOff size={18} /> : <Pin size={18} />}
        </button>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isHost && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                <Crown size={10} />
                HOST
              </div>
            )}
            <span className="text-white font-semibold text-sm drop-shadow-md">
              {name} {isLocal && "(You)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isHandRaised && (
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg animate-bounce text-amber-900 border border-amber-500/50">
                <Hand size={18} fill="currentColor" />
              </div>
            )}
            {audioEnabled ? (
              <div className="w-6 h-6 bg-white/10 backdrop-blur-sm rounded-md flex items-center justify-center">
                <Mic size={14} className="text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-red-500/80 backdrop-blur-sm rounded-md flex items-center justify-center border border-red-400/50">
                <MicOff size={14} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
