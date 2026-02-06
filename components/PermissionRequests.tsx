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
    <div className="fixed top-20 right-4 z-50 w-80 space-y-2">
      {waitingPeers.map((peer) => (
        <div
          key={peer.id}
          className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {peer.name}
              </p>
              <p className="text-sm text-gray-500">wants to join the meeting</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onApprove(peer.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Check size={18} />
              Admit
            </button>
            <button
              onClick={() => onReject(peer.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
            >
              <X size={18} />
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {isRejected ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              The host has denied your request to join this meeting.
            </p>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
            >
              Go Back
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <Clock size={32} className="text-blue-600" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <Loader2 size={16} className="text-blue-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Waiting for approval
            </h2>
            <p className="text-gray-600 mb-2">
              {meetingTitle && (
                <span className="block font-medium text-gray-800 mb-1">
                  {meetingTitle}
                </span>
              )}
              The host will let you in soon...
            </p>
            <div className="flex justify-center gap-1 mb-6">
              <span
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
