import React, { useState } from "react";
import { Game } from "../types";
import { Magnet, FolderOpen, X, Check, Copy, Link, Terminal } from "lucide-react";

interface GameDetailsModalProps {
  game: Game | null;
  onClose: () => void;
  onLinkExe: (game: Game, path: string) => void;
  onRemoveLink: (game: Game) => void;
  isGameInLibrary: boolean;
  linkedPath?: string;
  themeStyle: any;
  onCopyMagnet: (magnet: string) => void;
}

export default function GameDetailsModal({
  game,
  onClose,
  onLinkExe,
  onRemoveLink,
  isGameInLibrary,
  linkedPath,
  themeStyle,
  onCopyMagnet
}: GameDetailsModalProps) {
  const [exePath, setExePath] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!game) return null;

  // Find magnet url in downloads array if not present directly
  const magnetUrl = game.magnet || game.downloads?.[0]?.magnet || game.downloads?.[0]?.url || "";
  const displaySize = game.fileSize || game.size || "Unknown Size";

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exePath.trim()) return;
    onLinkExe(game, exePath.trim());
    setExePath("");
    setIsLinking(false);
  };

  const handleGenerateAndCopyMagnet = () => {
    if (!magnetUrl) return;
    onCopyMagnet(magnetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-scale-up text-left">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/5 p-4 bg-neutral-950">
          <div className="space-y-1 overflow-hidden pr-4">
            <span className="bg-neutral-800 border border-white/5 text-[9px] font-bold font-mono tracking-widest text-neutral-400 px-2 py-0.5 rounded-md uppercase">
              {game.source}
            </span>
            <h2 className="text-lg font-bold font-display text-white line-clamp-1">
              {game.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-black/40 border border-white/5 p-4 rounded-lg font-mono text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Approx Size</span>
              <span className="text-white font-bold">{displaySize}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Database Origin</span>
              <span className={`text-white font-bold uppercase ${themeStyle.text}`}>{game.source}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {magnetUrl ? (
              <a
                href={magnetUrl}
                onClick={handleGenerateAndCopyMagnet}
                className={`flex-1 ${themeStyle.bg} hover:brightness-110 text-neutral-950 px-4 py-3 rounded-lg font-mono text-xs font-semibold uppercase flex items-center justify-center gap-2 transition text-center`}
              >
                <Magnet className="w-4 h-4 shrink-0 fill-current" />
                <span>🧲 {copied ? "Copied Magnet!" : "Magnet Download Link"}</span>
              </a>
            ) : (
              <div className="flex-1 bg-neutral-800 py-3 text-center text-xs font-mono text-neutral-500 border border-white/5 rounded-lg select-none">
                No Magnet URL found
              </div>
            )}

            {/* Link Executive Button */}
            {!isGameInLibrary ? (
              <button
                onClick={() => setIsLinking(true)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-750 border border-white/5 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase text-white flex items-center justify-center gap-2 transition"
              >
                <FolderOpen className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Link Local EXE File</span>
              </button>
            ) : (
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-lg text-xs font-mono font-semibold text-emerald-400 flex items-center justify-center gap-2">
                <Check className="w-4.5 h-4.5 shrink-0" />
                <span>In Library</span>
              </div>
            )}
          </div>

          {/* Expanded Link Path Forms */}
          {isLinking && (
            <form onSubmit={handleLinkSubmit} className="bg-neutral-950/50 border border-white/5 p-4 rounded-lg space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Terminal className={`w-4 h-4 ${themeStyle.text}`} />
                <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
                  ENTER FILE EXECUTABLE PATH
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. C:\Games\SuperGame\game.exe"
                  value={exePath}
                  onChange={(e) => setExePath(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-700 focus:outline-none focus:border-white/10"
                />
                <button
                  type="submit"
                  className={`px-3 py-2 text-xs font-mono font-bold uppercase text-black ${themeStyle.bg} rounded-lg hover:brightness-110 transition shrink-0`}
                >
                  Link
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const mock_path = `C:\\Games\\SteamLibrary\\steamapps\\common\\${game.title.replace(/[^a-z0-9]/gi, "")}\\bin\\x64\\${game.title.replace(/[^a-z0-9]/gi, "").toLowerCase()}.exe`;
                    setExePath(mock_path);
                  }}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 underline cursor-pointer transition font-mono uppercase"
                >
                  Auto-generate Mock Path
                </button>
                <button
                  type="button"
                  onClick={() => setIsLinking(false)}
                  className="text-[10px] text-neutral-400 hover:text-white transition font-mono uppercase"
                >
                  Close panel
                </button>
              </div>
            </form>
          )}

          {/* Linked Executable Path Display inside details */}
          {isGameInLibrary && linkedPath && (
            <div className="border border-white/5 bg-black/20 p-3 rounded-lg space-y-1.5 flex flex-col justify-between">
              <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase block">
                Linked shortcut executable
              </span>
              <div className="flex items-center justify-between gap-4 font-mono text-xs">
                <code className="text-neutral-300 truncate font-mono text-[11px] selection:bg-neutral-800">
                  {linkedPath}
                </code>
                <button
                  onClick={() => onRemoveLink(game)}
                  className="text-xs text-red-500 hover:text-red-400 transition hover:bg-neutral-800 px-2 py-1 rounded border border-white/5 uppercase font-mono tracking-tighter shrink-0"
                >
                  Unlink File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
