"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search,
    Filter,
    MoreVertical,
    Play,
    Clock,
    Calendar,
    BarChart2,
    Edit3,
    Trash2,
    Plus,
    Video,
    Mic,
    Settings,
    Menu,
    Home,
    Users,
    Database,
    PlayCircle,
    Archive,
    BarChart3,
    Layers,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

interface Episode {
    id: string;
    title: string;
    guests: string;
    status: "published" | "draft" | "recording" | "scheduled";
    duration: string;
    listens: string;
    trend: string;
    isUp: boolean;
    recordedDate: string;
    publishedDate: string;
    type: "video" | "audio";
}

export default function AnalyticsPage() {
    return (
        <DashboardLayout>
            <AnalyticsContent />
        </DashboardLayout>
    );
}

function AnalyticsContent() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "published" | "draft" | "recording" | "scheduled">("all");

    const mockEpisodes: Episode[] = [
        {
            id: "1",
            title: "The Future of AI in Content Creation",
            guests: "Sarah Mitchell",
            status: "published",
            duration: "42:15",
            listens: "1,247",
            trend: "+12.5%",
            isUp: true,
            recordedDate: "1 Aug 2024",
            publishedDate: "3 Aug 2024",
            type: "video"
        },
        {
            id: "2",
            title: "Building Successful Podcasts from Scratch",
            guests: "John Davis, Mike Chen",
            status: "published",
            duration: "38:30",
            listens: "892",
            trend: "+3.2%",
            isUp: true,
            recordedDate: "5 Aug 2024",
            publishedDate: "7 Aug 2024",
            type: "video"
        },
        {
            id: "3",
            title: "Monetization Strategies for Creators",
            guests: "Emily Rodriguez",
            status: "draft",
            duration: "45:00",
            listens: "0",
            trend: "0%",
            isUp: true,
            recordedDate: "8 Aug 2024",
            publishedDate: "-",
            type: "audio"
        },
        {
            id: "4",
            title: "Interview with Tech Entrepreneur",
            guests: "Alex Thompson",
            status: "recording",
            duration: "In Progress",
            listens: "0",
            trend: "0%",
            isUp: true,
            recordedDate: "10 Aug 2024",
            publishedDate: "Scheduled",
            type: "video"
        },
        {
            id: "5",
            title: "Storytelling Techniques for Podcasters",
            guests: "Lisa Anderson, Tom Wilson",
            status: "published",
            duration: "51:20",
            listens: "2,143",
            trend: "+24.8%",
            isUp: true,
            recordedDate: "12 Aug 2024",
            publishedDate: "14 Aug 2024",
            type: "audio"
        },
        {
            id: "6",
            title: "Growing Your Audience Organically",
            guests: "Rachel Kim",
            status: "published",
            duration: "36:45",
            listens: "1,678",
            trend: "-2.4%",
            isUp: false,
            recordedDate: "15 Aug 2024",
            publishedDate: "17 Aug 2024",
            type: "video"
        },
    ];

    const filteredEpisodes = mockEpisodes.filter(ep => {
        const matchesFilter = activeFilter === "all" || ep.status === activeFilter;
        const matchesSearch = ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.guests.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusStyle = (status: Episode["status"]) => {
        switch (status) {
            case "published": return "bg-green-100 text-green-700";
            case "draft": return "bg-amber-100 text-amber-700";
            case "recording": return "bg-red-100 text-red-700 animate-pulse";
            case "scheduled": return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Analytics Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: "Total Listens", value: "12,842", trend: "+12%", isUp: true, icon: BarChart3, color: "blue" },
                    { label: "Avg. Duration", value: "42m", trend: "+2m", isUp: true, icon: Clock, color: "purple" },
                    { label: "Completion Rate", value: "84%", trend: "+5%", isUp: true, icon: TrendingUp, color: "green" },
                    { label: "Engagement", value: "4.8k", trend: "-1.2%", isUp: false, icon: Users, color: "amber" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={20} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-green-600' : 'text-red-500'}`}>
                                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.trend}
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#37322F] mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-200 w-fit">
                    {(["all", "published", "draft", "recording", "scheduled"] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeFilter === filter
                                ? "bg-[#37322F] text-white shadow-md"
                                : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#37322F] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search episodes for analytics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#37322F]/5 focus:border-[#37322F] transition-all w-72 text-sm font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-8 pr-2 custom-scrollbar">
                {filteredEpisodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-200 border-dashed">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <Database size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-[#37322F] mb-2">No analytics data found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search query to find specific episode metrics.</p>
                    </div>
                ) : (
                    filteredEpisodes.map((episode) => (
                        <div key={episode.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:border-gray-200 transition-all group border-l-4 border-l-transparent hover:border-l-[#37322F]">
                            <div className="flex items-center gap-6">
                                {/* Thumbnail */}
                                <div className={`w-40 h-24 rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-sm ${episode.type === 'video' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                                    }`}>
                                    <div className="absolute inset-0 bg-black/5" />
                                    {episode.type === 'video' ? <Video className="text-white/40" size={24} /> : <Mic className="text-white/40" size={24} />}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                                        {episode.type}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-[#37322F] truncate group-hover:text-black transition-colors">{episode.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(episode.status)}`}>
                                            {episode.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                            <Users size={14} className="text-gray-400" />
                                            {episode.guests}
                                        </p>
                                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                            <Calendar size={14} />
                                            {episode.recordedDate}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Listens</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-[#37322F]">{episode.listens}</span>
                                                <span className={`flex items-center text-[10px] font-black ${episode.isUp ? 'text-green-600' : 'text-red-500'}`}>
                                                    {episode.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {episode.trend}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duration</div>
                                            <div className="text-base font-bold text-[#37322F]">{episode.duration}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                                    <button className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 rounded-xl transition-all shadow-sm" title="View Full Report">
                                        <BarChart2 size={20} />
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl transition-all shadow-sm" title="More Options">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
