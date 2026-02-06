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
    Layers
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

interface Episode {
    id: string;
    title: string;
    guests: string;
    status: "published" | "draft" | "recording" | "scheduled";
    duration: string;
    listens: string;
    recordedDate: string;
    publishedDate: string;
    type: "video" | "audio";
}

export default function EpisodesPage(){
    return(
        <DashboardLayout>
            <EpisodesContent />
        </DashboardLayout>
    )

}

function EpisodesContent() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "published" | "draft" | "recording" | "scheduled">("all");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const mockEpisodes: Episode[] = [
        {
            id: "1",
            title: "The Future of AI in Content Creation",
            guests: "Sarah Mitchell",
            status: "published",
            duration: "42:15",
            listens: "1,247",
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
        <div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8 bg-[#FAFAF9]">
                    <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-2xl border border-gray-200 w-fit">
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

                    <div className="grid grid-cols-1 gap-4">
                        {filteredEpisodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <Database size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-[#37322F]">No episodes found</h3>
                                <p className="text-gray-500">Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            filteredEpisodes.map((episode) => (
                                <div key={episode.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-xl hover:border-gray-300 transition-all group">
                                    <div className="flex items-center gap-6">
                                        {/* Thumbnail Placeholder */}
                                        <div className={`w-36 h-24 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0 ${episode.type === 'video' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                                            }`}>
                                            <div className="absolute inset-0 bg-black/10 transition-all" />
                                            {episode.type === 'video' ? <Video className="text-white/50" /> : <Mic className="text-white/50" />}
                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase tracking-tighter">
                                                {episode.type}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(episode.status)}`}>
                                                    {episode.status}
                                                </span>
                                                <h3 className="text-lg font-bold text-[#37322F] truncate">{episode.title}</h3>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3 font-medium flex items-center gap-2">
                                                <Users size={14} />
                                                {episode.guests}
                                            </p>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                    <Clock size={14} />
                                                    {episode.duration}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                    <BarChart2 size={14} />
                                                    {episode.listens} Listens
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                    <Calendar size={14} />
                                                    {episode.recordedDate}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pr-2">
                                            <button className="p-2 hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 rounded-lg transition-all" title="Launch Player">
                                                <PlayCircle size={20} fill="currentColor" className="text-white" />
                                            </button>
                                            <button className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-all" title="Edit Episode">
                                                <Edit3 size={20} />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-all" title="More Options">
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
