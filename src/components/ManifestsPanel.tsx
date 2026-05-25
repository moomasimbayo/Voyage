import React, { useState, useEffect } from "react";
import { Game } from "../types";
import { Search, ChevronLeft, ChevronRight, FileCode, CheckCircle, HelpCircle, Download, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";

interface ManifestsPanelProps {
  onAddGameToLibrary: (game: Game) => void;
  library: Game[];
  themeStyle: any;
  steamToolsInstalled: boolean;
  onToggleSteamToolsInstalled: () => void;
}

interface ManifestItem {
  id: string;
  name: string;
  size: string;
  files: string[];
}

export default function ManifestsPanel({
  onAddGameToLibrary,
  library,
  themeStyle,
  steamToolsInstalled,
  onToggleSteamToolsInstalled
}: ManifestsPanelProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ManifestItem | null>(null);
  
  // Alert state for missing external app
  const [showAppAlert, setShowAppAlert] = useState(false);
  const [alertTargetGame, setAlertTargetGame] = useState<ManifestItem | null>(null);

  // Download feedback animation state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchManifests = async (searchQuery: string, currentPage: number) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/manifests?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=12`);
      if (resp.ok) {
        const data = await resp.json();
        setManifests(data.items);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error("Error drawing manifests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial manifests on mount or search/page change
  useEffect(() => {
    fetchManifests(query, page);
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchManifests(query, 1);
  };

  const handleSyncManifestList = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/manifests/sync", { method: "POST" });
      if (res.ok) {
        setPage(1);
        await fetchManifests(query, 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadClick = (item: ManifestItem) => {
    if (!steamToolsInstalled) {
      setAlertTargetGame(item);
      setShowAppAlert(true);
      return;
    }

    // Trigger simulation and adding to library
    setDownloadingId(item.id);
    const mockProtocolUrl = `steamtools://add-manifest/${item.id}`;
    
    // Attempt deep link action
    try {
      // Create a hidden temporary anchor or download iframe to tap custom schemes without freezing browser
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = mockProtocolUrl;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1500);
    } catch (err) {
      console.warn("Could not dispatch steamtools:// app launcher in sandbox frame:", err);
    }

    setTimeout(() => {
      // Add to main App library with type: "singleplayer"
      onAddGameToLibrary({
        title: item.name,
        source: `AppID: ${item.id}`,
        type: "singleplayer",
        fileSize: item.size || "15 GB",
        linkPath: item.files?.[0] ? `C:\\SteamTools\\manifests\\${item.id}\\${item.files[0]}` : `C:\\SteamTools\\depots\\${item.id}_Depot.exe`,
        addedDate: new Date().toISOString().split("T")[0]
      });
      setDownloadingId(null);
    }, 2000);
  };

  const isAlreadyInLibrary = (id: string) => {
    return library.some(g => g.type === "singleplayer" && g.source.includes(id));
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header with Title and Global SteamTools Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            STEAM <span className="neon-glow" style={{ color: themeStyle.color }}>MANIFESTS</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Inject secure single-player decryption keys into local steam directory.
          </p>
        </div>

        {/* Global SteamTools Indicator */}
        <div className="flex items-center gap-3">
          <div className="glass-panel px-3 py-2 rounded-lg border flex items-center gap-2.5" style={{ borderColor: `${themeStyle.color}15` }}>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-neutral-500 font-mono tracking-wider">STEAMTOOLS PROTOCOL</span>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${steamToolsInstalled ? "bg-emerald-500 animate-pulse" : "bg-neutral-600 animate-pulse"}`} />
                <span className={`text-[11px] font-mono font-bold uppercase ${steamToolsInstalled ? "text-emerald-400" : "text-neutral-400"}`}>
                  {steamToolsInstalled ? "CLIENT RUNNING" : "NOT DETECTED"}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleSteamToolsInstalled}
              className={`px-2.5 py-1 text-[10px] uppercase font-mono font-bold rounded cursor-pointer border hover:scale-105 transition duration-150 ${
                steamToolsInstalled 
                  ? "bg-neutral-900 text-neutral-400 border-white/5 hover:text-white" 
                  : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
              }`}
            >
              {steamToolsInstalled ? "DISCONNECT" : "FORCE LINK"}
            </button>
          </div>

          <button
            onClick={handleSyncManifestList}
            disabled={isSyncing}
            className="p-2.5 bg-neutral-900 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition flex items-center gap-1.5 duration-200"
            title="Force refresh database manifest cache"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="text-[10px] font-mono leading-none font-bold uppercase hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Manifest App Missing Warning Modal */}
      {showAppAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#070707] border border-red-500/35 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-red-950/20 border-b border-red-500/20 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">LAUNCH FAILURE : COMPANION APP MISSING</span>
                <span className="text-xs text-neutral-400">SteamTools External Agent was not detected.</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-white">
                  You cannot stream or authorize Single Player manifest games without the SteamTools client helper.
                </p>
                <div className="text-xs text-neutral-400 leading-relaxed bg-[#0c0c0c] border border-white/5 p-4 rounded-xl family-mono">
                  <span className="text-neutral-500 block uppercase font-mono font-bold text-[10px] mb-1">Why is this required?</span>
                  SteamTools handles local depot path interception, virtual license injection, and directory unlocking to allow real steam executables to run in sandbox environments safely.
                </div>
              </div>

              <div className="bg-white/5 p-3.5 rounded-xl text-xs space-y-2 border border-white/5 text-neutral-300">
                <span className="font-semibold text-neutral-100 uppercase tracking-wider text-[10px] block font-mono">Setup Requirements Checklist:</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Download <strong className="text-white font-normal">SteamTools GUI Console</strong> for windows.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Register the custom local deep-link URL protocol bindings (<code className="text-[#00f0ff]">steamtools://</code>).</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                <button
                  onClick={() => {
                    // Force skip and bypass
                    setShowAppAlert(false);
                    onToggleSteamToolsInstalled();
                    if (alertTargetGame) {
                      setTimeout(() => handleDownloadClick(alertTargetGame), 100);
                    }
                  }}
                  className="w-full sm:flex-1 bg-neutral-900 border border-white/10 py-3 rounded-xl text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition text-neutral-300 hover:text-white cursor-pointer"
                >
                  I'm Installed (Force Bypass)
                </button>
                <button
                  onClick={() => {
                    const downloadUri = "https://github.com/SteamTools-Team/GameList";
                    window.open(downloadUri, "_blank", "noreferrer");
                  }}
                  className="w-full sm:flex-1 bg-white/10 hover:bg-white/15 py-3 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 text-white cursor-pointer"
                >
                  <span>Install SteamTools App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowAppAlert(false);
                    setAlertTargetGame(null);
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: searchable manifests grid */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search Steam Database AppIDs or names..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
                style={{ "--tw-ring-color": themeStyle.color } as any}
              />
            </div>
            <button
              type="submit"
              className="px-6 bg-[#050505] border border-white/5 hover:border-white/15 font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
            >
              Query
            </button>
          </form>

          {/* Catalog Listing */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeStyle.color, borderTopColor: "transparent" }}></div>
              <span className="text-xs font-mono text-neutral-400 animate-pulse uppercase tracking-wider">Syncing Steam Depots...</span>
            </div>
          ) : manifests.length === 0 ? (
            <div className="border border-dashed border-white/5 p-12 rounded-xl text-center glass-panel">
              <HelpCircle className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
              <span className="text-xs font-mono text-neutral-400 uppercase font-semibold">No results found</span>
              <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto">
                No Single-Player manifest entries correspond to your search. Try queries like "Cyberpunk", "Elden", "Resident", "Hades" or "Terraria".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {manifests.map((game) => {
                const isSaved = isAlreadyInLibrary(game.id);
                const isDownloadingNow = downloadingId === game.id;
                
                return (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`glass-panel border p-4 rounded-xl flex flex-col justify-between gap-3 text-left transition hover:border-[#00f0ff]/30 cursor-pointer ${
                      selectedGame?.id === game.id ? "ring-1 ring-[#00f0ff]/45" : ""
                    }`}
                    style={{ borderColor: selectedGame?.id === game.id ? themeStyle.color : "rgba(255, 255, 255, 0.05)" }}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="bg-white/5 border border-white/10 text-[9px] font-bold font-mono text-neutral-400 px-2 py-0.5 rounded-md uppercase">
                          AppID: {game.id}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono tracking-tight font-medium">
                          {game.size}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white tracking-wide text-sm truncate uppercase font-sans">
                        {game.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1.5 shrink-0">
                      <span className="text-[9px] text-neutral-500 font-mono uppercase font-bold">
                        {game.files?.length || 1} Depots
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSaved) handleDownloadClick(game);
                        }}
                        disabled={isDownloadingNow || isSaved}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition shrink-0 cursor-pointer ${
                          isSaved 
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" 
                            : "bg-neutral-900 border-white/5 hover:border-[#00f0ff]/50 hover:bg-neutral-850 text-white"
                        }`}
                        title={isSaved ? "Saved to Library" : "Install Depot Manifest"}
                      >
                        {isDownloadingNow ? (
                          <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: themeStyle.color, borderTopColor: "transparent" }}></div>
                        ) : isSaved ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-neutral-200" style={{ color: themeStyle.color }} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-neutral-900/30 border border-white/5 px-4 py-3 rounded-xl font-mono text-xs">
              <span className="text-neutral-500">
                Item counts: <strong className="text-white font-normal">{totalItems}</strong> entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 rounded disabled:opacity-30 cursor-pointer transition text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-neutral-300">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 rounded disabled:opacity-30 cursor-pointer transition text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Manifest Detail Inspector panel */}
        <div className="col-span-1">
          <div className="glass-panel border border-white/5 rounded-2xl p-5 sticky top-8 min-h-[350px] flex flex-col justify-between">
            {selectedGame ? (
              <div className="space-y-5 text-left h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">
                      MANIFEST DETAILS
                    </span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: themeStyle.color }}>
                      APPID {selectedGame.id}
                    </span>
                  </div>

                  <div className="space-y-4 mt-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 font-mono tracking-wider block">Game Title</span>
                      <h2 className="text-lg font-bold text-white uppercase tracking-tight font-sans leading-tight">
                        {selectedGame.name}
                      </h2>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-mono">DEPOT SIZE:</span>
                        <span className="text-white font-bold font-mono">{selectedGame.size}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-mono">LICENSE COST:</span>
                        <span className="text-emerald-400 font-bold font-mono">0.00$ FREE</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 font-mono tracking-wider block">Executable Filenames ({selectedGame.files?.length || 1})</span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {selectedGame.files && selectedGame.files.length > 0 ? (
                          selectedGame.files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-neutral-900/40 p-2 rounded border border-white/5 font-mono text-neutral-300 text-[11px] truncate leading-none">
                              <FileCode className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              <span className="truncate" title={file}>{file}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 bg-neutral-900/40 p-2 rounded border border-white/5 font-mono text-neutral-300 text-[11px] leading-none">
                            <FileCode className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span>launch.exe / default.exe</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-auto">
                  {isAlreadyInLibrary(selectedGame.id) ? (
                    <div className="w-full bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 rounded-xl py-3.5 text-center font-mono text-xs font-bold uppercase transition">
                      SAVED IN LIBRARY (SINGLE PLAYER)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownloadClick(selectedGame)}
                      disabled={downloadingId === selectedGame.id}
                      className={`w-full ${themeStyle.bg} hover:brightness-110 text-black font-mono text-xs font-bold uppercase py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
                    >
                      {downloadingId === selectedGame.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-black"></div>
                          <span>GENERATE VIRTUAL DEED...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>DOWNLOAD STAT MANIFEST</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px] my-auto">
                <HelpCircle className="w-10 h-10 text-neutral-700 mb-4 animate-bounce-short" />
                <span className="text-xs font-mono text-neutral-400 uppercase font-bold tracking-wider">No Game Selected</span>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  Select any single player application on the left grid to inspect depot metadata files, sizes, and file decryption trees.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
