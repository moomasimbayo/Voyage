import React, { useState, useRef } from "react";
import { AppConfig, Source } from "../types";
import { Trash2, AlertTriangle, Plus, Sliders, Settings, LayoutGrid, RotateCcw, Upload } from "lucide-react";
import HelmDiagnostics from "./HelmDiagnostics";

interface SettingsPanelProps {
  config: AppConfig;
  onUpdateSettings: (newSettings: AppConfig["settings"]) => void;
  onAddSource: (url: string) => void;
  onUploadSource: (name: string, downloads: any[]) => Promise<void>;
  onRemoveSource: (source: Source, removeGames: boolean) => void;
  onClearCache: () => void;
  onFullReset: () => void;
  isLoading: boolean;
  themeStyle: any;
}

export default function SettingsPanel({
  config,
  onUpdateSettings,
  onAddSource,
  onUploadSource,
  onRemoveSource,
  onClearCache,
  onFullReset,
  isLoading,
  themeStyle
}: SettingsPanelProps) {
  const [sourceUrlInput, setSourceUrlInput] = useState("");
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [linkedGamesCount, setLinkedGamesCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [schemaErrorModal, setSchemaErrorModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage speed cap adjustment
  const handleSpeedLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onUpdateSettings({
      ...config.settings,
      downloadCap: val
    });
  };

  // Manage theme dots change
  const handleThemeChange = (selectedTheme: AppConfig["settings"]["theme"]) => {
    onUpdateSettings({
      ...config.settings,
      theme: selectedTheme
    });
  };

  // Manage diagnostic rate
  const handleDiagnosticsRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({
      ...config.settings,
      systemStatsInterval: parseInt(e.target.value)
    });
  };

  // Trigger add link
  const handleInsertSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrlInput.trim()) return;
    onAddSource(sourceUrlInput.trim());
    setSourceUrlInput("");
  };

  // Initiate Delete Check
  const initiateSourceDelete = (source: Source) => {
    // Check how many games are in local user library matching this source
    const matchedCount = config.library.filter((g) => g.source === source.name).length;
    if (matchedCount > 0) {
      setLinkedGamesCount(matchedCount);
      setSourceToDelete(source);
    } else {
      // Direct remove if no linked library items, with a simple confirm check
      if (window.confirm(`Disconnnect source "${source.name}"?`)) {
        onRemoveSource(source, false);
      }
    }
  };

  // Confirm Delete Scenarios
  const finalizeSourceDelete = (removeGames: boolean) => {
    if (sourceToDelete) {
      onRemoveSource(sourceToDelete, removeGames);
      setSourceToDelete(null);
      setLinkedGamesCount(0);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Normalize JSON to support both flat arrays and objects with downloads
        let name = file.name.replace(/\.json$/i, "");
        let downloads: any[] = [];

        if (json && typeof json === "object") {
          if (json.name && Array.isArray(json.downloads)) {
            name = json.name;
            downloads = json.downloads;
          } else if (Array.isArray(json)) {
            downloads = json;
          } else if (Array.isArray(json.games)) {
            downloads = json.games;
            if (json.name) name = json.name;
          } else {
            // Check if any root keys hold an array
            const arrays = Object.values(json).filter(v => Array.isArray(v));
            if (arrays.length > 0) {
              downloads = arrays[0] as any[];
            } else {
              downloads = [json];
            }
          }
        }

        // --- STRICT FORMAT VALIDATION ---
        let isValidFormat = true;
        if (downloads.length === 0) {
          isValidFormat = false;
        } else {
          // Check sample of up to 5 items for title and url keys
          const sampleSlice = downloads.slice(0, Math.min(downloads.length, 5));
          const validCount = sampleSlice.filter((g: any) => {
            const hasTitle = g.title || g.Name || g.name || g.game_name;
            const hasUrl = g.Url || g.url || g.downloadUrl || g.download_urls || g.downloads || g.link || g.Link || g.magnet;
            return hasTitle && hasUrl;
          }).length;

          if (validCount === 0) {
            isValidFormat = false;
          }
        }

        if (!isValidFormat) {
          setIsUploading(false);
          setSchemaErrorModal(true);
          return;
        }

        // Normalize keys inside downloads to matches title/urls
        const normalizedDownloads = downloads.map((g: any, index: number) => {
          // Robust checking with Capital casing support (matches All.Games.json flat formats)
          const title = g.title || g.Name || g.name || g.game_name || `Imported Item ${index + 1}`;
          
          let download_urls: string[] = [];
          if (Array.isArray(g.download_urls)) {
            download_urls = g.download_urls;
          } else if (Array.isArray(g.downloadUrls)) {
            download_urls = g.downloadUrls;
          } else if (Array.isArray(g.downloads)) {
            download_urls = g.downloads.map((d: any) => typeof d === "string" ? d : (d.url || d.Url || d.downloadUrl || d.link || d.Link));
          } else if (g.download_urls && typeof g.download_urls === "string") {
            download_urls = [g.download_urls];
          } else if (g.downloadUrl && typeof g.downloadUrl === "string") {
            download_urls = [g.downloadUrl];
          } else if (g.url && typeof g.url === "string") {
            download_urls = [g.url];
          } else if (g.Url && typeof g.Url === "string") {
            download_urls = [g.Url];
          } else if (g.magnet && typeof g.magnet === "string") {
            download_urls = [g.magnet];
          } else if (g.link && typeof g.link === "string") {
            download_urls = [g.link];
          } else if (g.Link && typeof g.Link === "string") {
            download_urls = [g.Link];
          }

          return {
            title,
            version: g.version || g.build || "Full Version",
            file_size: g.file_size || g.size || g.fileSize || "6.5 GB",
            genre: g.genre || g.genres || "Action, Adventure",
            upload_date: g.upload_date || g.date || new Date().toISOString(),
            download_urls: download_urls.filter(Boolean)
          };
        });

        await onUploadSource(name, normalizedDownloads);
      } catch (err: any) {
        console.error("Failed to parse JSON configuration file:", err);
        alert(`Failed to parse file: ${err.message || String(err)}`);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      alert("Failed to read the selected file.");
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left relative">
      {/* Visual Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          CONTROL <span className={`${themeStyle.text} neon-glow`}>PANELS</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">Configure download speeds, cache databases, and change themes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Sources integration */}
        <div className="glass-panel rounded-xl p-5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <LayoutGrid className="w-4.5 h-4.5" style={{ color: themeStyle.color }} />
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-neutral-300">
              JSON Download Sources
            </h2>
          </div>

          {/* Source URL adder input */}
          <form onSubmit={handleInsertSource} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste source JSON URL..."
                value={sourceUrlInput}
                onChange={(e) => setSourceUrlInput(e.target.value)}
                className="flex-1 bg-[#050505] border border-white/5 rounded-lg px-3.5 py-2.5 text-xs font-mono text-neutral-300 placeholder-neutral-500 focus:outline-none focus:border-[#00f0ff]/40 focus:ring-1 focus:ring-[#00f0ff]/20 transition"
                style={{ "--tw-ring-color": themeStyle.color } as any}
              />
              <button
                type="submit"
                disabled={isLoading || !sourceUrlInput.trim()}
                className="px-4 bg-[#050505] border border-white/5 font-mono text-xs font-bold uppercase hover:border-[#00f0ff]/50 transition rounded-lg shrink-0 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                style={{ color: themeStyle.color }}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: themeStyle.color, borderTopColor: "transparent" }}></div>
                ) : (
                  <Plus className="w-4 h-4 shrink-0" />
                )}
                <span>Add Link</span>
              </button>
            </div>
            {/* Note: Example helper description text removed beneath textbox as requested by user! */}
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-2 text-neutral-500 font-mono text-[9px]">
            <div className="flex-1 h-px bg-white/5"></div>
            <span>OR</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          {/* Local Drag & Drop File Upload */}
          <div 
            onClick={handleFileUploadClick}
            className="border border-dashed border-white/5 hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/5 p-4 rounded-xl text-center cursor-pointer transition select-none flex flex-col items-center justify-center gap-1.5"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeStyle.color, borderTopColor: "transparent" }}></div>
            ) : (
              <Upload className="w-5 h-5 text-neutral-400 animate-pulse" />
            )}
            <div className="text-xs font-semibold text-neutral-300">
              {isUploading ? "Processing database..." : "Import Local JSON File"}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono uppercase">
              Drag file here or click to browse
            </div>
          </div>

          {/* Sources List */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
              ACTIVE REPOSITORIES
            </span>

            {config.sources.length === 0 ? (
              <div className="border border-dashed border-white/5 py-4 rounded-lg text-center font-mono text-[10px] text-neutral-500 uppercase">
                No repositories bound
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {config.sources.map((src) => (
                  <div
                    key={src.url}
                    className="flex justify-between items-center gap-4 bg-neutral-950/80 border border-white/5 hover:border-white/10 p-3 rounded-lg leading-tight transition"
                  >
                    <div className="flex-1 overflow-hidden space-y-0.5">
                      <span className="text-sm font-semibold text-white block truncate">
                        {src.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 block truncate leading-none">
                        {src.url}
                      </span>
                    </div>

                    <button
                      onClick={() => initiateSourceDelete(src)}
                      className="text-neutral-500 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition shrink-0"
                      title="Disconnect Source"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Speed and theme options */}
        <div className="glass-panel rounded-xl p-5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Sliders className="w-4.5 h-4.5" style={{ color: themeStyle.color }} />
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-neutral-300">
              Downloads & Performance
            </h2>
          </div>

          {/* Speed limit setting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 font-sans tracking-wide">
                Download Speed Cap (Global)
              </label>
              <span className="text-xs font-mono font-bold bg-neutral-950 border border-white/5 px-2.5 py-1 rounded-md" style={{ color: themeStyle.color }}>
                {config.settings.downloadCap === 0 ? "Unlimited" : `${config.settings.downloadCap} MB/s`}
              </span>
            </div>

            <div className="flex items-center gap-4 bg-[#050505] border border-white/5 p-3 rounded-lg">
              <input
                type="range"
                id="setting-download-cap-slider"
                min="0"
                max="100"
                step="5"
                value={config.settings.downloadCap}
                onChange={handleSpeedLimitChange}
                className="flex-grow h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: themeStyle.color }}
              />
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Limits bandwidth allocation. Integrated background downloads are capped to prevent packet bottlenecking and local router choke.
            </p>
          </div>

          {/* Theme custom picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-bold">
                Neon Accent Theme
              </label>
              <div className="flex items-center gap-2.5 bg-[#050505] border border-white/5 px-3 py-2.5 rounded-lg justify-around">
                {/* Cyan-Purple theme dot */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("cyan-purple")}
                  className={`w-6 h-6 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#8a2be2] text-[9px] relative ring-offset-neutral-950 ${config.settings.theme === "cyan-purple" ? "ring-2 ring-white" : ""}`}
                  title="Cyan Purple Theme"
                />
                {/* Emerald theme dot */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("emerald")}
                  className={`w-6 h-6 rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] text-[9px] relative ring-offset-neutral-950 ${config.settings.theme === "emerald" ? "ring-2 ring-white" : ""}`}
                  title="Emerald Theme"
                />
                {/* Crimson theme dot */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("crimson")}
                  className={`w-6 h-6 rounded-full bg-gradient-to-r from-[#ef4444] to-[#991b1b] text-[9px] relative ring-offset-neutral-950 ${config.settings.theme === "crimson" ? "ring-2 ring-white" : ""}`}
                  title="Crimson Theme"
                />
                {/* Gold theme dot */}
                <button
                  type="button"
                  onClick={() => handleThemeChange("gold")}
                  className={`w-6 h-6 rounded-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] text-[9px] relative ring-offset-neutral-950 ${config.settings.theme === "gold" ? "ring-2 ring-white" : ""}`}
                  title="Gold Theme"
                />
              </div>
            </div>

            {/* Poll stats interval */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-bold">
                Diagnostic Polling Rate
              </label>

              <div className="relative bg-[#050505] border border-white/5 px-3 py-1 bg-none rounded-lg flex items-center">
                <select
                  value={config.settings.systemStatsInterval}
                  onChange={handleDiagnosticsRateChange}
                  className="w-full h-8 bg-transparent text-xs font-mono font-bold text-neutral-300 uppercase focus:outline-none cursor-pointer"
                >
                  <option value="1000">Fast (1s)</option>
                  <option value="3000">Balanced (3s)</option>
                  <option value="10000">Eco-Friendly (10s)</option>
                </select>
                <span className="text-[8px] text-neutral-500 pointer-events-none p-1 shrink-0">▼</span>
              </div>
            </div>
          </div>

          {/* Clean performance utilities */}
          <div className="border-t border-white/5 pt-4 flex gap-3">
            <button
              onClick={onClearCache}
              className="flex-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-mono text-xs font-semibold uppercase py-2 rounded-lg border border-white/5 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Clear Cache</span>
            </button>
            <button
              onClick={onFullReset}
              className="flex-1 bg-red-950/20 border border-red-900/35 hover:bg-red-950/40 text-red-500 font-mono text-xs font-semibold py-2 rounded-lg uppercase transition flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Full Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voyage Steer-Helm Controller Mapping & Core SDL2 Diagnostics */}
      <HelmDiagnostics themeStyle={themeStyle} />

      {/* Dynamic Source deletion check confirmation modal */}
      {sourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-red-500/20 rounded-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 p-4 bg-red-950/30 border-b border-red-500/20 text-red-400 font-semibold font-display tracking-tight leading-tight">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>DISCONNECT REPOSITORY WARNING</span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-neutral-300 leading-relaxed text-left">
                You are about to isolate repository <strong className="text-white">"{sourceToDelete.name}"</strong> from your catalog.
              </p>

              <div className="bg-neutral-950 border border-white/5 p-3.5 rounded-lg text-left">
                <span className="text-[9px] font-mono tracking-wider text-red-500 uppercase font-bold block mb-1">
                  Alert: Linked Library Assets Detected
                </span>
                <p className="text-xs text-neutral-400">
                  You have <strong className="text-white">{linkedGamesCount}</strong> items downloaded or linked in your private Library that belong to this source.
                </p>
              </div>

              <p className="text-xs text-neutral-400 leading-snug text-left pt-1">
                Select your desired deletion outcome to safely align configuration files:
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => finalizeSourceDelete(true)}
                  className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase py-2.5 rounded-lg transition"
                >
                  Delete BOTH the Source and its Games
                </button>
                <button
                  onClick={() => finalizeSourceDelete(false)}
                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-mono text-xs font-bold uppercase py-2.5 rounded-lg transition"
                >
                  Remove ONLY the Source (Keep the games)
                </button>
                <button
                  onClick={() => {
                    setSourceToDelete(null);
                    setLinkedGamesCount(0);
                  }}
                  className="text-neutral-400 hover:text-white font-mono text-xs uppercase py-2 text-center transition decoration-neutral-500 underline"
                >
                  Cancel Operation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Schema Format Mismatch & Diagnostic Guide Modal */}
      {schemaErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-amber-500/30 rounded-xl overflow-hidden shadow-2xl animate-scale-up text-left my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-5 bg-amber-950/20 border-b border-white/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">JSON File Schema Mismatch</h3>
                  <p className="text-[10px] uppercase font-mono text-neutral-400 mt-0.5">Validation failed: Invalid gaming file configuration</p>
                </div>
              </div>
              <button 
                onClick={() => setSchemaErrorModal(false)}
                className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                <span className="text-xs font-bold px-1 font-mono">ESC</span>
              </button>
            </div>

            {/* Layout Information Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scroll">
              <p className="text-xs text-neutral-300 leading-relaxed">
                The uploaded database JSON file cannot be loaded because it does not match our registry formats. In order to list game files, titles, and download linkages in local and remote interfaces, your file <strong>must contain at least one valid item</strong> that aligns with one of our accepted specifications:
              </p>

              <div className="space-y-4">
                {/* Structure A */}
                <div className="bg-neutral-950/80 border border-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                      Template A: SteamRip Catalog Schema
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">Recommended</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    A root object holding a repository <code className="text-neutral-200">name</code> string and a <code className="text-neutral-200">downloads</code> array containing game listing items.
                  </p>
                  <pre className="text-[10px] bg-neutral-900 p-3 rounded border border-white/5 text-neutral-400 font-mono overflow-x-auto leading-normal select-all">
{`{
  "name": "My Custom Library Name",
  "downloads": [
    {
      "title": "Minecraft",
      "version": "1.21",
      "file_size": "1.2 GB",
      "genre": "Sandbox, Adventure",
      "download_urls": ["https://steamrip.com/minecraft"]
    }
  ]
}`}
                  </pre>
                </div>

                {/* Structure B */}
                <div className="bg-neutral-950/80 border border-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-[#00f0ff] uppercase">
                      Template B: Flat Games List Schema (All.Games.json style)
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 uppercase font-semibold">Casing Agnostic</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    A flat JSON array of objects, containing individual entries with game names and setup URLs. Properties can be capitalized or lowercase tags.
                  </p>
                  <pre className="text-[10px] bg-neutral-900 p-3 rounded border border-white/5 text-neutral-400 font-mono overflow-x-auto leading-normal select-all">
{`[
  {
    "Name": "#BLUD",
    "Url": "https://steamrip.com/blud"
  },
  {
    "title": "Minecraft",
    "download_urls": ["https://steamrip.com/minecraft"]
  }
]`}
                  </pre>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-4 flex gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider font-mono">Troubleshooting File Imports</h4>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Ensure there are no trailing commas, mismatched quotes, or system registry artifacts in the JSON payload. Ensure your files are saved using the <code className="text-amber-400">.json</code> extension before uploading.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-neutral-950 px-5 py-4 flex justify-end gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setSchemaErrorModal(false)}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 font-mono text-xs font-bold uppercase rounded-lg text-white transition cursor-pointer"
              >
                Ack / Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
