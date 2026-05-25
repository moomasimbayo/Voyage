import React from "react";
import { Game, SystemStats } from "../types";
import { Cpu, LayoutDashboard, Library, Play, Info, Flame, Sparkles } from "lucide-react";

interface DashboardPanelProps {
  stats: SystemStats;
  recentGames: Game[];
  onLaunchGame: (game: Game) => void;
  onNavigate: (tabId: string) => void;
  themeStyle: any;
  libraryCount: number;
}

export default function DashboardPanel({
  stats,
  recentGames,
  onLaunchGame,
  onNavigate,
  themeStyle,
  libraryCount
}: DashboardPanelProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.2

  const calculateOffset = (percentage: number) => {
    return circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  };

  return (
    <div id="dashboard-panel" className="space-y-8 animate-fade-in">
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
            Welcome Back, Pilot
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            System core synchronized. All repositories reachable at <span className="font-semibold text-[#00f0ff]" style={{ color: themeStyle.color }}>1.4gbps</span>.
          </p>
        </div>
        <div 
          className="flex items-center gap-4 text-xs font-mono bg-[#0c0c0c]/70 border px-4 py-2.5 rounded-lg text-neutral-400 backdrop-blur-md"
          style={{ borderColor: `${themeStyle.color}1c` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM ACTIVE</span>
          </div>
          <span className="text-white/10">|</span>
          <div>
            STATUS: <span className="font-bold text-[#00f0ff]" style={{ color: themeStyle.color }}>SECURED</span>
          </div>
        </div>
      </div>

      {/* Immersive 3-Column Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Gauge Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} className="stroke-white/5 fill-none" strokeWidth="8" />
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                className="fill-none duration-500 transition-all ease-out" 
                stroke={themeStyle.color} 
                strokeWidth="8" 
                strokeDasharray={circumference} 
                strokeDashoffset={calculateOffset(stats.cpu)} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-mono text-white">{stats.cpu}%</span>
              <span className="text-[9px] text-neutral-500 uppercase font-bold">CPU Load</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 font-mono">CORE FREQUENCY: 4.2GHz</span>
        </div>

        {/* RAM Usage Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} className="stroke-white/5 fill-none" strokeWidth="8" />
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                className="fill-none duration-500 transition-all ease-out" 
                stroke="#8a2be2" 
                strokeWidth="8" 
                strokeDasharray={circumference} 
                strokeDashoffset={calculateOffset(stats.ram)} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-mono text-white">{stats.ram}%</span>
              <span className="text-[9px] text-neutral-500 uppercase font-bold">RAM Usage</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 font-mono">AVAILABLE: 11.4GB</span>
        </div>

        {/* Active Bandwidth Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase mb-4 tracking-widest font-display text-left" style={{ color: themeStyle.color }}>
              Active Bandwidth
            </div>
            {/* Holographic equalizer bars */}
            <div className="h-12 flex items-end gap-1 px-1">
              <div className="flex-1 bg-white/10 h-[20%] rounded-sm transition-all duration-300"></div>
              <div className="flex-1 bg-white/10 h-[40%] rounded-sm transition-all duration-300"></div>
              <div className="flex-1 h-[60%] rounded-sm neon-glow transition-all duration-300" style={{ backgroundColor: themeStyle.color }}></div>
              <div className="flex-1 h-[80%] rounded-sm neon-glow transition-all duration-300" style={{ backgroundColor: themeStyle.color }}></div>
              <div className="flex-1 h-[55%] rounded-sm neon-glow transition-all duration-300" style={{ backgroundColor: themeStyle.color }}></div>
              <div className="flex-1 bg-white/10 h-[30%] rounded-sm transition-all duration-300"></div>
              <div className="flex-1 bg-[#8a2be2] h-[90%] rounded-sm transition-all duration-300"></div>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center font-mono text-[10px]">
            <span className="text-neutral-500">LIMIT CAP:</span>
            <span className="text-white font-bold">UNLIMITED</span>
          </div>
        </div>
      </div>

      {/* Navigation shortcuts and Quick Launch Hub Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate("discover")}
            className="text-white p-5 rounded-xl flex items-center gap-4 text-xs font-mono font-bold uppercase transition glass-panel hover:bg-white/[0.04] text-left cursor-pointer border"
            style={{ borderColor: `${themeStyle.color}22` }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
              <LayoutDashboard className="w-4 h-4 text-neutral-300" />
            </div>
            <div>
              <span className="block text-white text-sm">Explore Catalog</span>
              <span className="block text-[10px] text-neutral-400 font-normal">Browse SteamRip DB files</span>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate("library")}
            className="text-white p-5 rounded-xl flex items-center justify-between gap-4 text-xs font-mono font-bold uppercase transition glass-panel hover:bg-white/[0.04] text-left cursor-pointer border"
            style={{ borderColor: `${themeStyle.color}22` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
                <Library className="w-4 h-4 text-neutral-300" />
              </div>
              <div>
                <span className="block text-white text-sm">My Library</span>
                <span className="block text-[10px] text-neutral-400 font-normal">View linked executables</span>
              </div>
            </div>
            <span className={`text-[10px] bg-neutral-900 px-2 py-0.5 rounded-md border border-white/5`} style={{ color: themeStyle.color }}>
              {libraryCount}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Launch / Recent Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[4px] font-display">Quick Launch Hub</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
          <button
            onClick={() => onNavigate("library")}
            className="text-xs font-mono text-neutral-400 hover:text-white transition uppercase flex items-center gap-1.5 shrink-0 pl-4"
          >
            <span>Library view</span>
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentGames.length === 0 ? (
          <div className="border border-dashed border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center glass-panel">
            <span className="text-sm text-neutral-500 font-mono uppercase">Your Quick Access is Empty</span>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Linked executables and added games appear here for fast-track launching. Switch to "Discover" or "Library" to link your first application.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map((game, idx) => (
              <div
                key={`${game.title}-${idx}`}
                className="glass-panel hover:border-[#00f0ff]/50 rounded-xl p-4 flex items-center justify-between gap-4 group transition card-hover-effect cursor-pointer"
                style={{ ["--accent-primary" as any]: themeStyle.color, ["--accent-primary-glow" as any]: themeStyle.glow }}
                onClick={() => onLaunchGame(game)}
              >
                <div className="overflow-hidden space-y-1">
                  <h3 className="font-semibold text-white truncate text-sm leading-tight text-left">
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                    <span className="bg-white/5 px-2 py-0.5 border border-white/5 rounded text-[9px]/normal uppercase truncate max-w-[124px]">
                      {game.source}
                    </span>
                    {game.fileSize && <span className="text-neutral-500">{game.fileSize}</span>}
                  </div>
                </div>
                <button 
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 group-hover:border-[#00f0ff]/50 flex items-center justify-center text-white transition shrink-0"
                  style={{ borderColor: `rgba(255,255,255,0.05)` }}
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white translate-x-[1px]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
