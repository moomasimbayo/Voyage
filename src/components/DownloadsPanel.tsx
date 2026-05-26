import React from "react";
import { DownloadItem } from "../types";
import { Play, Pause, Trash2, CheckCircle2, Server, HelpCircle, HardDrive, ArrowDownCircle, BadgeAlert } from "lucide-react";

interface DownloadsPanelProps {
  downloads: DownloadItem[];
  onPauseDownload: (id: string) => void;
  onResumeDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onClearCompleted: () => void;
  themeStyle: any;
  downloadCap: number;
}

export default function DownloadsPanel({
  downloads,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onClearCompleted,
  themeStyle,
  downloadCap
}: DownloadsPanelProps) {
  const activeDownloads = downloads.filter((d) => d.status === "downloading" || d.status === "extracting");
  const completedDownloads = downloads.filter((d) => d.status === "completed" || d.status === "allocated");
  
  // Calculate average current speed
  let totalSpeedNum = 0;
  activeDownloads.forEach((d) => {
    const val = parseFloat(d.downloadSpeed);
    if (!isNaN(val)) totalSpeedNum += val;
  });
  const currentSpeedStr = totalSpeedNum > 0 ? `${totalSpeedNum.toFixed(1)} MB/s` : "0.0 MB/s";

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header bar and real-time Bandwidth meter dashboard */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display tracking-wide uppercase text-white flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-[#00f0ff]" style={{ color: themeStyle.color }} />
            Voyage <span className="neon-glow" style={{ color: themeStyle.color }}>Downloader</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time in-app torrent and direct high-speed decompression stream.
          </p>
        </div>

        {/* Bandwidth dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 flex flex-col justify-center min-w-[130px]">
            <span className="text-[9px] uppercase font-mono font-bold text-neutral-500 tracking-wider">NETWORK FLOW</span>
            <span className={`text-sm font-semibold font-mono ${totalSpeedNum > 0 ? "text-emerald-400 animate-pulse" : "text-neutral-400"}`}>
              {currentSpeedStr}
            </span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 flex flex-col justify-center min-w-[130px]">
            <span className="text-[9px] uppercase font-mono font-bold text-neutral-500 tracking-wider">BANDWIDTH LIMIT</span>
            <span className="text-sm font-semibold font-mono text-neutral-300">
              {downloadCap === 0 ? "UNLIMITED" : `${downloadCap} MB/S`}
            </span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-center sm:flex-col gap-2 min-w-[130px]">
            <span className="text-[9px] uppercase font-mono font-bold text-neutral-500 tracking-wider hidden sm:inline">HISTORY</span>
            <button
              onClick={onClearCompleted}
              disabled={completedDownloads.length === 0}
              className="text-[10px] uppercase font-mono font-bold text-red-400 hover:text-red-300 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          </div>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-xl py-24 text-center glass-panel">
          <Server className="w-12 h-12 text-neutral-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-white font-semibold font-display tracking-wide uppercase text-sm">No Active Downloads</h3>
          <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed px-4">
            Browse the and discover files from the <strong className="text-white">Discover Catalog</strong> panel, choose your game, and start your download directly in the app to avoid dealing with external browsers!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active section */}
          {activeDownloads.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                ACTIVE PIPELINE ({activeDownloads.length})
              </span>
              <div className="space-y-3">
                {activeDownloads.map((item) => {
                  const isExtracting = item.status === "extracting";
                  return (
                    <div
                      key={item.id}
                      className="glass-panel border border-white/10 hover:border-[#00f0ff]/30 p-4 rounded-xl flex flex-col gap-3 transition-colors duration-200"
                    >
                      {/* Meta header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="bg-white/5 text-[9px] font-bold font-mono tracking-wide px-2 py-0.5 rounded text-neutral-400 uppercase">
                            {item.game.source}
                          </span>
                          <h4 className="text-sm font-bold text-white line-clamp-1">
                            {item.game.title}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2.5 font-mono text-xs text-neutral-400 shrink-0">
                          {isExtracting ? (
                            <span className="text-amber-400 text-[11px] font-bold uppercase animate-pulse flex items-center gap-1">
                              <HardDrive className="w-3.5 h-3.5 animate-bounce" />
                              Unpacking Files...
                            </span>
                          ) : (
                            <>
                              <span className="text-emerald-400 font-bold">{item.downloadSpeed}</span>
                              <span className="text-neutral-600">|</span>
                              <span>ETA: {item.eta}</span>
                              <span className="text-neutral-600">|</span>
                              <span>{item.downloadedSize} / {item.totalSize}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-neutral-500">
                          <span>{item.status.toUpperCase()}</span>
                          <span className="text-white" style={{ color: themeStyle.color }}>{item.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isExtracting ? "bg-amber-500 animate-pulse" : "bg-[#00f0ff]"
                            }`}
                            style={{ 
                              width: `${item.progress}%`,
                              backgroundColor: isExtracting ? undefined : themeStyle.color,
                              boxShadow: isExtracting ? undefined : `0 0 10px ${themeStyle.glow}`
                            }}
                          />
                        </div>
                      </div>

                      {/* Action trigger footer */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className="text-[10px] font-mono text-neutral-500">
                          {isExtracting 
                            ? "Writing package sector streams directly to C:\\Games\\VoyageLibrary..." 
                            : "Downloading via TCP virtual pipeline client..."
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === "downloading" ? (
                            <button
                              onClick={() => onPauseDownload(item.id)}
                              className="p-1.5 duration-200 hover:bg-white/5 rounded border border-white/5 text-neutral-400 hover:text-white cursor-pointer"
                              title="Pause download stream"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isExtracting) onResumeDownload(item.id);
                              }}
                              disabled={isExtracting}
                              className="p-1.5 duration-200 hover:bg-white/5 rounded border border-white/5 text-neutral-400 hover:text-white cursor-pointer disabled:opacity-30"
                              title="Resume download stream"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onCancelDownload(item.id)}
                            className="p-1.5 duration-200 hover:bg-red-500/10 rounded border border-red-500/10 text-red-400 hover:text-red-300 cursor-pointer"
                            title="Cancel / delete download task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* History / Completed section */}
          {completedDownloads.length > 0 && (
            <div className="space-y-3 pt-4">
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                FINISHED DOWNLOADS ({completedDownloads.length})
              </span>
              <div className="space-y-2">
                {completedDownloads.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel border border-white/5 bg-neutral-950/25 p-3.5 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold font-mono text-emerald-400 px-1.5 py-0.2 rounded uppercase">
                          Installed
                        </span>
                        <h4 className="text-xs font-bold text-neutral-200 truncate pr-4">
                          {item.game.title}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-500 block">
                          Size: {item.totalSize} • Target: C:\Games\VoyageLibrary\{item.game.title.replace(/[^a-zA-Z0-9]/g, "")}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onCancelDownload(item.id)}
                      className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 text-neutral-500 hover:text-red-400 rounded-lg transition duration-200 cursor-pointer shrink-0"
                      title="Clear from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
