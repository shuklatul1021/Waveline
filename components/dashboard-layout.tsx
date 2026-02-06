"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Settings, Video, User, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { Play } from "next/font/google";
import Link from "next/link";

interface PodcastEpisode {
    id: string;
    title: string;
    guests: string;
    status: "published" | "draft" | "recording";
    duration: string;
    listens: string;
    recordedDate: string;
    publishedDate: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${sidebarCollapsed ? "w-16" : "w-64"
                    } bg-white border-r border-gray-100 flex flex-col transition-all duration-300`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-gray-100">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#37322F] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">W</span>
                            </div>
                            <span className="font-semibold text-[#37322F]">Waveline</span>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="w-8 h-8 bg-[#37322F] rounded-lg flex items-center justify-center mx-auto">
                            <span className="text-white font-bold text-sm">R</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F7F5F3] text-[#37322F] font-medium hover:bg-[#F0EFEE] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3 10L10 3L17 10M5 8V17C5 17.5304 5.21071 18.0391 5.58579 18.4142C5.96086 18.7893 6.46957 19 7 19H13C13.5304 19 14.0391 18.7893 14.4142 18.4142C14.7893 18.0391 15 17.5304 15 17V8"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {!sidebarCollapsed && <span>Home</span>}
                        </button>

                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M17 18V16C17 14.9391 16.5786 13.9217 15.8284 13.1716C15.0783 12.4214 14.0609 12 13 12H7C5.93913 12 4.92172 12.4214 4.17157 13.1716C3.42143 13.9217 3 14.9391 3 16V18M13 6C13 7.65685 11.6569 9 10 9C8.34315 9 7 7.65685 7 6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {!sidebarCollapsed && <span>Guests</span>}
                        </button>

                        {!sidebarCollapsed && (
                            <div className="pt-4 pb-2">
                                <span className="px-3 text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                    Episodes
                                </span>
                            </div>
                        )}

                        <Link href="/episodes" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3 8L10 13L17 8M3 8L10 3L17 8M3 8V16L10 21M17 8V16L10 21M10 21V13"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {!sidebarCollapsed && <span>All Episodes</span>}
                        </Link>

                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3 5H17M3 10H17M3 15H17"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {!sidebarCollapsed && <span>Audio Library</span>}
                        </button>

                        <Link href="/analytics" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3 4V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H17M7 14L10 11L12 13L17 8M17 8V11M17 8H14"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {!sidebarCollapsed && <span>Analytics</span>}
                        </Link>

                        {!sidebarCollapsed && (
                            <div className="pt-4 pb-2">
                                <span className="px-3 text-xs font-semibold text-[#9B9B98] uppercase tracking-wider">
                                    Settings
                                </span>
                            </div>
                        )}

                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#6B6B68] hover:bg-[#F7F5F3] hover:text-[#37322F] transition-colors">
                            <Settings />
                            {!sidebarCollapsed && <span>Settings</span>}
                        </button>
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 bg-[#37322F] rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">JD</span>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#37322F] truncate">
                                    John Doe
                                </div>
                                <div className="text-xs text-[#9B9B98] truncate">
                                    john@company.com
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 hover:bg-[#F7F5F3] rounded-lg transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M3 10H17M3 5H17M3 15H17"
                                    stroke="#37322F"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        <h1 className="text-xl font-semibold text-[#37322F]">
                            My Episodes
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 relative">
                        <button className="p-2 hover:bg-[#F7F5F3] rounded-lg transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M15 6L9 12L5 8"
                                    stroke="#37322F"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-100"
                            >
                                <div className="w-8 h-8 bg-[#37322F] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    JD
                                </div>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showProfileDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowProfileDropdown(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                            <p className="text-sm font-bold text-[#37322F]">John Doe</p>
                                            <p className="text-xs text-gray-500 font-medium">john@company.com</p>
                                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                                                Pro Plan
                                            </div>
                                        </div>

                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#37322F] transition-colors font-medium">
                                            <User size={16} />
                                            View Profile
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#37322F] transition-colors font-medium">
                                            <CreditCard size={16} />
                                            Billing & Subscription
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#37322F] transition-colors font-medium">
                                            <Settings size={16} />
                                            Account Settings
                                        </button>

                                        <div className="h-px bg-gray-50 my-1"></div>

                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold">
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-8 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}