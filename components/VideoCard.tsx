"use client";

import React, { useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  PinOff,
  Maximize2,
  Monitor,
  Crown,
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
  isSpeaking?: boolean;
  isScreenShare?: boolean;
  variant?: "gallery" | "speaker" | "filmstrip" | "pip";
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
  isScreenShare = false,
  isSpeaking = false,
  variant = "gallery",
  onToggleSpotlight,
  onToggleVideo,
  onToggleAudio,
  className = "",
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    }
    return () => {
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [stream]);

  const initials = name.substring(0, 2).toUpperCase();
  const firstName = name.split(" ")[0];

  const sizeClasses =
    variant === "pip" ? "w-[220px] h-[160px]" : "w-full h-full";

  return (
    <div
      className={`relative overflow-hidden group transition-all duration-300 ${sizeClasses} ${
        variant === "pip"
          ? "rounded-2xl shadow-2xl border border-white/[0.08] bg-[#18181B]"
          : "rounded-xl bg-[#18181B]"
      } ${
        isSpeaking && !isSpotlighted
          ? "ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-[#0D0D0D]"
          : ""
      } ${isSpotlighted ? "ring-2 ring-indigo-500/70 ring-offset-1 ring-offset-[#0D0D0D]" : ""} ${
        isScreenShare ? "ring-1 ring-blue-500/30" : ""
      } ${className}`}
    >
      {/* Video Element */}
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenShare ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1E1E22] to-[#141416] flex items-center justify-center">
          <div className="text-center">
            <div
              className={`${
                variant === "pip" || variant === "filmstrip"
                  ? "w-12 h-12"
                  : "w-16 h-16 md:w-20 md:h-20"
              } rounded-full flex items-center justify-center mx-auto ${
                isHost
                  ? "bg-gradient-to-br from-indigo-600/40 to-purple-700/40 ring-2 ring-indigo-500/20"
                  : "bg-gradient-to-br from-[#2A2A2E] to-[#1F1F23] ring-2 ring-white/[0.06]"
              }`}
            >
              <span
                className={`text-white/90 font-semibold ${
                  variant === "pip" || variant === "filmstrip"
                    ? "text-lg"
                    : "text-2xl md:text-3xl"
                }`}
              >
                {initials}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gradient overlay at bottom for name readability */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Hand Raised Indicator */}
      {isHandRaised && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce text-amber-900 ring-2 ring-amber-300/50">
            <Hand size={15} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Screen share badge */}
      {isScreenShare && (
        <div className="absolute top-2.5 left-2.5 z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-medium shadow-lg">
            <Monitor size={12} />
            <span>Screen Share</span>
          </div>
        </div>
      )}

      {/* Host badge */}
      {isHost && !isScreenShare && (
        <div className="absolute top-2.5 left-2.5 z-20">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] font-medium">
            <Crown size={10} />
            <span>Host</span>
          </div>
        </div>
      )}

      {/* Hover action menu */}
      {!isLocal && onToggleSpotlight && variant !== "pip" && (
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <button
            onClick={onToggleSpotlight}
            className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/[0.06]"
            title={isSpotlighted ? "Remove spotlight" : "Spotlight"}
          >
            {isSpotlighted ? <PinOff size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      )}

      {/* Local video hover controls */}
      {isLocal && !isScreenShare && variant !== "pip" && (
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <button
            onClick={onToggleVideo}
            className={`p-2 rounded-lg transition-all backdrop-blur-md border ${
              videoEnabled
                ? "bg-black/40 hover:bg-black/60 text-white/80 border-white/[0.06]"
                : "bg-red-500/90 hover:bg-red-600 text-white border-red-400/20"
            }`}
          >
            {videoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
          </button>
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-lg transition-all backdrop-blur-md border ${
              audioEnabled
                ? "bg-black/40 hover:bg-black/60 text-white/80 border-white/[0.06]"
                : "bg-red-500/90 hover:bg-red-600 text-white border-red-400/20"
            }`}
          >
            {audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
          </button>
        </div>
      )}

      {/* Bottom name bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Mic status indicator */}
            {!isScreenShare && (
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  !audioEnabled
                    ? "bg-red-500/90"
                    : "bg-white/[0.12] backdrop-blur-sm"
                }`}
              >
                {audioEnabled ? (
                  <Mic size={12} className="text-white/90" />
                ) : (
                  <MicOff size={12} className="text-white" />
                )}
              </div>
            )}
            {/* Name label */}
            <span className="text-white text-[13px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
              {variant === "pip"
                ? firstName
                : isLocal
                  ? `${firstName} (You)`
                  : name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
