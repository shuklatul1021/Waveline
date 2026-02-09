"use client";

import React, { useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  PinOff,
  MoreHorizontal,
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
  isSpeaking = false,
  variant = "gallery",
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
  const firstName = name.split(" ")[0];

  const sizeClasses =
    variant === "pip"
      ? "w-[200px] h-[150px]"
      : variant === "filmstrip"
        ? "w-full h-full"
        : "w-full h-full";

  return (
    <div
      className={`relative bg-[#2A2522] overflow-hidden group transition-all duration-300 ${sizeClasses} ${
        variant === "pip"
          ? "rounded-lg shadow-2xl border border-white/10"
          : "rounded-lg"
      } ${
        isSpeaking && !isSpotlighted
          ? "ring-2 ring-[#37322F] ring-offset-1 ring-offset-[#1A1714]"
          : ""
      } ${isSpotlighted ? "ring-2 ring-[#49423D]" : ""} ${className}`}
    >
      {/* Video Element */}
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full bg-[#2A2522] flex items-center justify-center">
          <div className="text-center">
            <div
              className={`${
                variant === "pip" || variant === "filmstrip"
                  ? "w-12 h-12"
                  : "w-16 h-16 md:w-20 md:h-20"
              } ${
                isHost ? "bg-[#49423D]" : "bg-[#37322F]"
              } rounded-full flex items-center justify-center mx-auto border-2 border-[#E5E5E0]/10`}
            >
              <span
                className={`text-[#E5E5E0] font-semibold ${
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

      {/* Hand Raised Indicator - top right */}
      {isHandRaised && (
        <div className="absolute top-2 right-2 z-20">
          <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce text-amber-900">
            <Hand size={14} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Hover action menu - Zoom style "..." */}
      {!isLocal && onToggleSpotlight && variant !== "pip" && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={onToggleSpotlight}
            className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all backdrop-blur-sm"
            title={isSpotlighted ? "Remove spotlight" : "Spotlight"}
          >
            {isSpotlighted ? (
              <PinOff size={14} />
            ) : (
              <MoreHorizontal size={14} />
            )}
          </button>
        </div>
      )}

      {/* Local video hover controls */}
      {isLocal && variant !== "pip" && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={onToggleVideo}
            className={`p-1.5 rounded transition-all backdrop-blur-sm ${
              videoEnabled
                ? "bg-black/40 hover:bg-black/60 text-white/80"
                : "bg-red-500/90 text-white"
            }`}
          >
            {videoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
          </button>
          <button
            onClick={onToggleAudio}
            className={`p-1.5 rounded transition-all backdrop-blur-sm ${
              audioEnabled
                ? "bg-black/40 hover:bg-black/60 text-white/80"
                : "bg-red-500/90 text-white"
            }`}
          >
            {audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
          </button>
        </div>
      )}

      {/* Bottom name badge - Zoom style */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            {/* Mic indicator */}
            <div
              className={`w-5 h-5 rounded-sm flex items-center justify-center ${
                !audioEnabled ? "bg-red-500/90" : "bg-black/50 backdrop-blur-sm"
              }`}
            >
              {audioEnabled ? (
                <Mic size={11} className="text-white" />
              ) : (
                <MicOff size={11} className="text-white" />
              )}
            </div>
            {/* Name */}
            <span className="text-white text-xs font-medium drop-shadow-lg px-1 py-0.5 bg-black/40 backdrop-blur-sm rounded-sm">
              {variant === "pip"
                ? firstName
                : isLocal
                  ? `${firstName} (You)`
                  : name}
              {isHost && (
                <span className="ml-1 text-[10px] text-[#E5E5E0]/70">
                  (Host)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
