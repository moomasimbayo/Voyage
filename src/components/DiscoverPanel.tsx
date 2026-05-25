import React, { useState, useEffect } from "react";
import { Game } from "../types";
import { Search, Globe, ChevronRight } from "lucide-react";

interface DiscoverPanelProps {
  games: Game[];
  sources: Array<{ name: string; url: string }>;
  onSelectGame: (game: Game) => void;
  isLoading: boolean;
  themeStyle: any;
}

export default function DiscoverPanel({
  games,
  sources,
  onSelectGame,
  isLoading,
  themeStyle
}: DiscoverPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [sortOrder, setSortOrder] = useState("alpha-asc");

  // Debounce search input to avoid lag during typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Handle filtering
  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesSource = selectedSource === "all" || game.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  // Handle sorting
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortOrder === "alpha-asc") {
      return a.title.localeCompare(b.title);
    } else if (sortOrder === "alpha-desc") {
      return b.title.localeCompare(a.title);
    } else if (sortOrder === "size-desc" || sortOrder === "size-asc") {
      // Custom parser for file sizes (e.g. "45.1 GB" or "840 MB")
      const getSizeInMb = (sizeStr?: string) => {
        if (!sizeStr) return 0;
        const normalized = sizeStr.trim().toLowerCase();
        const num = parseFloat(normalized.replace(/[^0-9.]/g, ""));
        if (isNaN(num)) return 0;
        if (normalized.includes("gb")) return num * 1024;
        if (normalized.includes("tb")) return num * 1024 * 1024;
        return num; // default to MB
      };

      const sizeA = getSizeInMb(a.fileSize || a.size);
      const sizeB = getSizeInMb(b.fileSize || b.size);
      return sortOrder === "size-desc" ? sizeB - sizeA : sizeA - sizeB;
    }
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters Header bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-4 rounded-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search catalog titles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[#050505] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
            style={{ "--tw-ring-color": themeStyle.color } as any}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
          {/* Source Dropdown */}
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="appearance-none w-full sm:w-44 bg-[#050505] border border-white/5 hover:bg-[#0c0c0c] px-4 py-2.5 pr-8 rounded-lg text-xs font-mono font-bold uppercase text-neutral-300 focus:outline-none focus:border-[#00f0ff]/40 cursor-pointer transition"
            >
              <option value="all">ALL SOURCES ({games.length})</option>
              {sources.map((src) => {
                const count = games.filter((g) => g.source === src.name).length;
                return (
                  <option key={src.name} value={src.name}>
                    {src.name.toUpperCase()} ({count})
                  </option>
                );
              })}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[8px]">▼</span>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none w-full sm:w-44 bg-[#050505] border border-white/5 hover:bg-[#0c0c0c] px-4 py-2.5 pr-8 rounded-lg text-xs font-mono font-bold uppercase text-neutral-300 focus:outline-none focus:border-[#00f0ff]/40 cursor-pointer transition"
            >
              <option value="alpha-asc">SORT: A-Z</option>
              <option value="alpha-desc">SORT: Z-A</option>
              <option value="size-desc">SORT: SIZE (MAX)</option>
              <option value="size-asc">SORT: SIZE (MIN)</option>
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[8px]">▼</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent ${themeStyle.border} animate-spin`}></div>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Compiling source indexes...</p>
        </div>
      ) : sortedGames.length === 0 ? (
        <div className="border border-dashed border-white/5 rounded-xl py-24 text-center">
          <Globe className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold font-display tracking-wide uppercase text-sm">NO GAMES FOUND</h3>
          <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto">
            {searchInput ? `No matching items for "${searchInput}". Try refining your keywords.` : "Verify configuration and connected databases inside settings."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedGames.map((game, idx) => (
            <div
              key={`${game.title}-${idx}`}
              onClick={() => onSelectGame(game)}
              className="glass-panel hover:border-[#00f0ff]/40 rounded-xl p-4 flex flex-col justify-between gap-4 card-hover-effect cursor-pointer group text-left transition duration-300"
              style={{ ["--accent-primary" as any]: themeStyle.color, ["--accent-primary-glow" as any]: themeStyle.glow }}
            >
              {/* Card Meta */}
              <div className="space-y-1.5 overflow-hidden">
                <span className="bg-white/5 border border-white/10 text-[9px] font-bold font-mono tracking-wider text-neutral-400 px-2 py-0.5 rounded-md uppercase">
                  {game.source}
                </span>

                <h3 className="font-semibold text-white group-hover:text-white transition line-clamp-2 text-sm leading-snug">
                  {game.title}
                </h3>
              </div>

              {/* Footer info in Card */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs font-mono">
                <span className="text-neutral-400 font-medium">
                  {game.fileSize || game.size || "N/A"}
                </span>

                <div 
                  className="flex items-center gap-1 text-[11px] font-bold opacity-80 group-hover:opacity-100 transition uppercase"
                  style={{ color: themeStyle.color }}
                >
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
