import React, { useState } from "react";
import { Game } from "../types";
import { Library, Play, Trash2, FolderOpen, AlertCircle, Plus, X, Search, Gamepad2, Users, ShieldAlert } from "lucide-react";

interface LibraryPanelProps {
  library: Game[];
  onLaunchGame: (game: Game) => void;
  onRemoveGame: (game: Game) => void;
  onAddLocalGame: (newGame: Game) => void;
  themeStyle: any;
}

export default function LibraryPanel({
  library,
  onLaunchGame,
  onRemoveGame,
  onAddLocalGame,
  themeStyle
}: LibraryPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [linkPath, setLinkPath] = useState("");
  const [sourceName, setSourceName] = useState("Local Link");
  const [gameCategoryType, setGameCategoryType] = useState<"singleplayer" | "multiplayer">("multiplayer");
  const [formError, setFormError] = useState("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Application Title is required");
      return;
    }
    if (!linkPath.trim()) {
      setFormError("Executables linking path is required");
      return;
    }

    onAddLocalGame({
      title: title.trim(),
      fileSize: fileSize.trim() || "0.0 GB",
      linkPath: linkPath.trim(),
      source: sourceName.trim() || "Local Link",
      type: gameCategoryType,
      addedDate: new Date().toISOString().split("T")[0]
    });

    // Reset Form
    setTitle("");
    setFileSize("");
    setLinkPath("");
    setSourceName("Local Link");
    setGameCategoryType("multiplayer");
    setFormError("");
    setIsAdding(false);
  };

  // Filter and Category segmentation
  const filteredGames = library.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const singlePlayerGames = filteredGames.filter((g) => g.type === "singleplayer");
  const multiplayerGames = filteredGames.filter((g) => g.type !== "singleplayer");

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            MY <span className={`${themeStyle.text} neon-glow`}>LIBRARY</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage launchers, linked shortcuts, and custom files.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase ${themeStyle.text} border border-white/5 hover:${themeStyle.border} bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add Local App</span>
        </button>
      </div>

      {/* Adding Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-white/5 p-4 bg-neutral-950">
              <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                LINK LOCAL EXECUTABLE
              </span>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setFormError("");
                }}
                className="text-neutral-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-xs font-mono text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                  Application Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyberpunk 2077"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#050505] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
                  style={{ "--tw-ring-color": themeStyle.color } as any}
                />
              </div>

              {/* Game Category selection in form */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block mb-1">
                  Gaming Mode Category
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setGameCategoryType("singleplayer")}
                    className={`p-2.5 rounded-lg border text-center transition flex justify-center items-center gap-1.5 cursor-pointer ${
                      gameCategoryType === "singleplayer"
                        ? "border-[#00f0ff] bg-[#00f0ff]/5 text-white font-bold"
                        : "border-white/5 bg-black/40 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Single Player</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameCategoryType("multiplayer")}
                    className={`p-2.5 rounded-lg border text-center transition flex justify-center items-center gap-1.5 cursor-pointer ${
                      gameCategoryType === "multiplayer"
                        ? "border-[#00f0ff] bg-[#00f0ff]/5 text-white font-bold"
                        : "border-white/5 bg-black/40 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Multiplayer</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                    Approx Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 70.2 GB"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full bg-[#050505] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
                    style={{ "--tw-ring-color": themeStyle.color } as any}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                    Source Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Steam"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full bg-[#050505] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
                    style={{ "--tw-ring-color": themeStyle.color } as any}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                  Executable Path *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. C:\Games\Cyberpunk\bin\x64\Cyberpunk2077.exe"
                    value={linkPath}
                    onChange={(e) => setLinkPath(e.target.value)}
                    className="w-full flex-1 bg-[#050505] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition font-mono text-xs"
                    style={{ "--tw-ring-color": themeStyle.color } as any}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randPaths = [
                        "C:\\Games\\SteamLibrary\\steamapps\\common\\Launcher.exe",
                        "D:\\Games\\RetroArch\\retroarch.exe",
                        "C:\\Program Files\\Epic Games\\Gamer\\EpicLauncher.exe"
                      ];
                      setLinkPath(randPaths[Math.floor(Math.random() * randPaths.length)]);
                    }}
                    className="px-3 bg-neutral-800 border border-white/5 rounded-lg text-xs font-mono text-neutral-300 hover:text-white transition flex items-center justify-center shrink-0 fill-none cursor-pointer"
                    title="Generate Mock Windows Path"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-neutral-800 py-2.5 text-xs font-mono font-bold uppercase text-neutral-400 rounded-lg hover:text-white hover:bg-neutral-750 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${themeStyle.bg} hover:brightness-110 py-2.5 text-xs font-mono font-bold uppercase text-black rounded-lg transition cursor-pointer`}
                >
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Library Filter Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search linked library shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#050505] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
          style={{ "--tw-ring-color": themeStyle.color } as any}
        />
      </div>

      {/* Library Grid Categories segment wrapper */}
      {library.length === 0 ? (
        <div className="border border-dashed border-white/5 rounded-xl py-20 text-center">
          <Library className="w-10 h-10 text-neutral-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-white font-semibold font-display tracking-wide uppercase text-sm">Library is empty</h3>
          <p className="text-xs text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
            You haven't linked any apps to your library yet. Link custom EXEs from "Discover," sync manifests from "Manifests" tab, or click the "+ Add Local App" button to set up shortcuts.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* CATEGORY 1: SINGLE PLAYER GAMES (from manifests) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Gamepad2 className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-neutral-200">
                Single Player Games ({singlePlayerGames.length})
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/10 px-1.5 py-0.5 rounded font-mono uppercase">
                Manifest games
              </span>
            </div>

            {singlePlayerGames.length === 0 ? (
              <div className="border border-dashed border-white/5 rounded-xl p-8 text-center bg-black/20 text-xs text-neutral-500">
                No single player manifest games mapped. Go to the Manifests panel on the navigation sidebar to install single-player depots.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {singlePlayerGames.map((game, idx) => (
                  <div
                    key={`${game.title}-${idx}`}
                    className="glass-panel hover:border-[#00f0ff]/40 rounded-xl p-4 flex flex-col justify-between gap-4 relative group transition duration-300"
                    style={{ ["--accent-primary" as any]: themeStyle.color, ["--accent-primary-glow" as any]: themeStyle.glow }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 overflow-hidden flex-1">
                        <span className="bg-amber-950/10 border border-amber-500/20 text-[9px] font-bold font-mono tracking-wider text-amber-400 px-2 py-0.5 rounded uppercase">
                          {game.source}
                        </span>
                        <h3 className="font-semibold text-white truncate text-sm uppercase">
                          {game.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => onRemoveGame(game)}
                        className="text-neutral-500 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                        title="Remove shortcut"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="space-y-3 mt-1">
                      {game.linkPath && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-500/70 bg-black/40 px-2.5 py-1.5 rounded-md leading-tight overflow-hidden text-ellipsis whitespace-nowrap border border-amber-500/5">
                          <FolderOpen className="w-3.5 h-3.5 text-amber-500/40 shrink-0" />
                          <span className="truncate">{game.linkPath}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
                        <span className="text-xs font-mono text-neutral-400">
                          {game.fileSize || "0.0 GB"}
                        </span>
                        <button
                          onClick={() => onLaunchGame(game)}
                          className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 bg-neutral-900 border border-white/5 hover:border-[#00f0ff]/50 rounded-md cursor-pointer text-white"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-white" style={{ color: themeStyle.color }} />
                          <span>DEC-LAUNCH</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY 2: MULTIPLAYER GAMES (from discover page) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Users className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-neutral-200">
                Multiplayer Games ({multiplayerGames.length})
              </h2>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/10 px-1.5 py-0.5 rounded font-mono uppercase">
                From Catalog / Custom Links
              </span>
            </div>

            {multiplayerGames.length === 0 ? (
              <div className="border border-dashed border-white/5 rounded-xl p-8 text-center bg-black/20 text-xs text-neutral-500">
                No multiplayer client links mapped. Discover games on the catalog search panel and link executables to library.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {multiplayerGames.map((game, idx) => (
                  <div
                    key={`${game.title}-${idx}`}
                    className="glass-panel hover:border-[#00f0ff]/40 rounded-xl p-4 flex flex-col justify-between gap-4 relative group transition duration-300"
                    style={{ ["--accent-primary" as any]: themeStyle.color, ["--accent-primary-glow" as any]: themeStyle.glow }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 overflow-hidden flex-1">
                        <span className="bg-purple-950/10 border border-purple-500/20 text-[9px] font-bold font-mono tracking-wider text-purple-400 px-2 py-0.5 rounded uppercase">
                          {game.source}
                        </span>
                        <h3 className="font-semibold text-white truncate text-sm uppercase">
                          {game.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => onRemoveGame(game)}
                        className="text-neutral-500 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                        title="Remove shortcut"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="space-y-3 mt-1">
                      {game.linkPath && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-purple-500/70 bg-black/40 px-2.5 py-1.5 rounded-md leading-tight overflow-hidden text-ellipsis whitespace-nowrap border border-purple-500/5">
                          <FolderOpen className="w-3.5 h-3.5 text-purple-500/40 shrink-0" />
                          <span className="truncate">{game.linkPath}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
                        <span className="text-xs font-mono text-neutral-400">
                          {game.fileSize || "0.0 GB"}
                        </span>
                        <button
                          onClick={() => onLaunchGame(game)}
                          className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 bg-neutral-900 border border-white/5 hover:border-[#00f0ff]/50 rounded-md cursor-pointer text-white"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-white" style={{ color: themeStyle.color }} />
                          <span>LAUNCH</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
