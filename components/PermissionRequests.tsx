"use client";

import React from "react";
import { Check, X, UserPlus, Clock, XCircle, Loader2 } from "lucide-react";

interface WaitingPeer {
  id: string;
  name: string;
}

interface PermissionRequestsProps {
  waitingPeers: WaitingPeer[];
  onApprove: (peerId: string) => void;
  onReject: (peerId: string) => void;
}

export function PermissionRequests({
  waitingPeers,
  onApprove,
  onReject,
}: PermissionRequestsProps) {
  if (waitingPeers.length === 0) return null;

  return (
    <div className="fixed top-20 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-80 max-w-80 space-y-2.5">
      {waitingPeers.map((peer) => (
        <div
          key={peer.id}
          className="bg-[#1E1E22]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.08] p-4 animate-slideIn"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-500/30">
              <UserPlus size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{peer.name}</p>
              <p className="text-sm text-white/50">wants to join the meeting</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onApprove(peer.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-600/20"
            >
              <Check size={16} />
              Admit
            </button>
            <button
              onClick={() => onReject(peer.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded-xl font-medium transition-all border border-white/[0.06]"
            >
              <X size={16} />
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface WaitingRoomProps {
  meetingTitle?: string;
  isWaiting: boolean;
  isRejected: boolean;
  onCancel: () => void;
}

export function WaitingRoom({
  meetingTitle,
  isWaiting,
  isRejected,
  onCancel,
}: WaitingRoomProps) {
  if (!isWaiting && !isRejected) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-[#1E1E22] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-white/[0.08]">
        {isRejected ? (
          <>
            <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-red-500/20">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/50 mb-6">
              The host has denied your request to join this meeting.
            </p>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3.5 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl font-medium transition-all border border-white/[0.06]"
            >
              Go Back
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-500/15 rounded-full flex items-center justify-center mx-auto mb-5 relative ring-1 ring-indigo-500/20">
              <Clock size={30} className="text-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1E1E22] rounded-full flex items-center justify-center ring-1 ring-white/[0.08]">
                <Loader2 size={14} className="text-indigo-400 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Waiting for approval
            </h2>
            <p className="text-white/50 mb-2">
              {meetingTitle && (
                <span className="block font-medium text-white/70 mb-1">
                  {meetingTitle}
                </span>
              )}
              The host will let you in soon...
            </p>
            <div className="flex justify-center gap-1.5 mb-6 mt-4">
              <span
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 rounded-xl font-medium transition-all border border-white/[0.06]"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
