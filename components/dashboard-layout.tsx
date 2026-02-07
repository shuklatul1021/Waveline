"use client";

import React, { useState } from "react";
import {
  Settings,
  LogOut,
  ChevronDown,
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
  Layers,
  Zap,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarCollapsed] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [usageExpanded, setUsageExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-16" : "w-[260px]"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#37322F] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            {!sidebarCollapsed && (
              <>
                <span className="font-semibold text-[#37322F] text-[15px]">
                  Waveline
                </span>
                <span className="text-gray-300 mx-1">/</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded text-xs text-gray-600 font-medium">
                  <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center">
                    <span className="text-emerald-600 text-[10px] font-bold">
                      A
                    </span>
                  </div>
                  Workspace
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 text-[#37322F] font-medium text-sm"
            >
              <Home size={18} className="text-gray-500" />
              {!sidebarCollapsed && <span>Home</span>}
            </Link>

            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <Users size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Customers</span>}
            </Link>
          </div>

          {!sidebarCollapsed && (
            <div className="pt-6 pb-2">
              <span className="px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Sessions
              </span>
            </div>
          )}

          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <Calendar size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Schedules</span>}
            </Link>

            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <FileText size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Recordings</span>}
            </Link>

            <Link
              href="/episodes"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <Layers size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Episodes</span>}
            </Link>
          </div>

          {!sidebarCollapsed && (
            <div className="pt-6 pb-2">
              <span className="px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Analytics
              </span>
            </div>
          )}

          <div className="space-y-0.5">
            <button
              onClick={() => setUsageExpanded(!usageExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-gray-400" />
                {!sidebarCollapsed && <span>Usage</span>}
              </div>
              {!sidebarCollapsed && (
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${usageExpanded ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {usageExpanded && !sidebarCollapsed && (
              <div className="ml-8 space-y-0.5">
                <Link
                  href="/analytics"
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 text-sm"
                >
                  Insights
                </Link>
                <Link
                  href="/analytics"
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 text-sm"
                >
                  Reports
                </Link>
              </div>
            )}

            <Link
              href="/pricing"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <Zap size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Plans</span>}
            </Link>

            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <CreditCard size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Billing</span>}
            </Link>

            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
            >
              <HelpCircle size={18} className="text-gray-400" />
              {!sidebarCollapsed && <span>Integrations</span>}
            </Link>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
          >
            <Settings size={18} className="text-gray-400" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
          >
            <LogOut size={18} className="text-gray-400" />
            {!sidebarCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 10.8333V15.8333C15 16.2754 14.8244 16.6993 14.5118 17.0118C14.1993 17.3244 13.7754 17.5 13.3333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V6.66667C2.5 6.22464 2.67559 5.80072 2.98816 5.48816C3.30072 5.17559 3.72464 5 4.16667 5H9.16667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 2.5H17.5V7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.33334 11.6667L17.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-[#37322F] rounded-full flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[#FAFAFA]">{children}</main>
      </div>
    </div>
  );
}
