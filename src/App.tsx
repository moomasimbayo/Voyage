/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { AppConfig, Game, Source, SystemStats, DownloadItem } from "./types";
import DashboardPanel from "./components/DashboardPanel";
import DiscoverPanel from "./components/DiscoverPanel";
import LibraryPanel from "./components/LibraryPanel";
import SettingsPanel from "./components/SettingsPanel";
import GameDetailsModal from "./components/GameDetailsModal";
import ManifestsPanel from "./components/ManifestsPanel";
import DownloadsPanel from "./components/DownloadsPanel";
import { Sdl2Emulator } from "./utils/sdl2Emulator";
import {
  LayoutDashboard,
  Globe,
  Library,
  Settings,
  Terminal,
  X,
  Info,
  Sparkles,
  Cpu,
  Layers,
  Gamepad2,
  Download
} from "lucide-react";

// Default configuration with SteamRip preloaded
const DEFAULT_CONFIG: AppConfig = {
  sources: [
    {
      name: "SteamRip",
      url: "https://raw.githubusercontent.com/7ROBE/SteamRip-Json/refs/heads/main/steamrip_games.json",
      addedDate: "2024-05-25"
    }
  ],
  library: [],
  settings: {
    theme: "cyan-purple",
    systemStatsInterval: 3000,
    downloadCap: 0
  }
};

const DEFAULT_STATS: SystemStats = {
  cpu: 12,
  ram: 45,
  disk: 24,
  uptime: "0h 0m",
  os: "Linux System Mode"
};

// CSS theme variations applied to body/wrappers
const THEME_PALETTE: Record<string, {
  text: string;
  bg: string;
  border: string;
  outline: string;
  gradient: string;
  color: string;
  glow: string;
}> = {
  "cyan-purple": {
    text: "text-[#00f0ff]",
    bg: "bg-[#00f0ff]",
    border: "border-[#00f0ff]",
    outline: "focus:ring-[#00f0ff]/30",
    gradient: "from-[#00f0ff] to-[#8a2be2]",
    color: "#00f0ff",
    glow: "rgba(0, 240, 255, 0.4)"
  },
  "emerald": {
    text: "text-[#10b981]",
    bg: "bg-[#10b981]",
    border: "border-[#10b981]",
    outline: "focus:ring-[#10b981]/30",
    gradient: "from-[#10b981] to-[#059669]",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.4)"
  },
  "crimson": {
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]",
    border: "border-[#ef4444]",
    outline: "focus:ring-[#ef4444]/30",
    gradient: "from-[#ef4444] to-[#991b1b]",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.4)"
  },
  "gold": {
    text: "text-[#eab308]",
    bg: "bg-[#eab308]",
    border: "border-[#eab308]",
    outline: "focus:ring-[#eab308]/30",
    gradient: "from-[#eab308] to-[#ca8a04]",
    color: "#eab308",
    glow: "rgba(234, 179, 8, 0.4)"
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "discover" | "library" | "settings" | "manifests" | "downloads">("dashboard");
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem("voyage_downloads");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [catalogGames, setCatalogGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<SystemStats>(DEFAULT_STATS);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  // SteamTools & Big Picture Controller Companion states
  const [steamToolsInstalled, setSteamToolsInstalled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("steamtools_installed") === "true";
    } catch {
      return false;
    }
  });
  const [bigPictureMode, setBigPictureMode] = useState<boolean>(false);
  const [bpSelectedIndex, setBpSelectedIndex] = useState<number>(0);
  
  // Custom interactive overlays and logs
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type?: "success" | "error" | "info" }>>([]);
  const [launchingGame, setLaunchingGame] = useState<Game | null>(null);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchLogs, setLaunchLogs] = useState<string[]>([]);
  
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Fetch configurations
  useEffect(() => {
    fetchConfig();
    fetchGamesList();
    checkSteamToolsStatus();
  }, []);

  // Save downloads to local cache
  useEffect(() => {
    try {
      localStorage.setItem("voyage_downloads", JSON.stringify(downloads));
    } catch {}
  }, [downloads]);

  // Download simulation tick logic
  useEffect(() => {
    const hasActive = downloads.some((d) => d.status === "downloading" || d.status === "extracting");
    if (!hasActive) return;

    const interval = setInterval(() => {
      setDownloads((prevList) => {
        let updated = false;
        const nextList = prevList.map((d) => {
          if (d.status === "downloading") {
            updated = true;

            // Parse total file size
            const totalStr = d.totalSize || "15 GB";
            let totalMb = 15360; 
            const parsedNum = parseFloat(totalStr.replace(/[^0-9.]/g, ""));
            if (!isNaN(parsedNum)) {
              if (totalStr.toLowerCase().includes("gb")) {
                totalMb = parsedNum * 1024;
              } else if (totalStr.toLowerCase().includes("kb")) {
                totalMb = parsedNum / 1024;
              } else {
                totalMb = parsedNum;
              }
            }

            // Cap respecting settings
            const cap = config.settings.downloadCap;
            let speedMbSec = 0;
            if (cap > 0) {
              speedMbSec = cap * (0.85 + Math.random() * 0.13); // 85% - 98% of cap
            } else {
              speedMbSec = 35 + Math.random() * 30; // 35 - 65 MB/s
            }

            const currentRatio = d.progress / 100;
            const currentDownloadedMb = totalMb * currentRatio;
            const nextDownloadedMb = Math.min(totalMb, currentDownloadedMb + speedMbSec);
            let nextProgress = Math.round((nextDownloadedMb / totalMb) * 100);

            if (nextProgress >= 100) {
              nextProgress = 100;
              return {
                ...d,
                progress: 100,
                downloadSpeed: "0.0 MB/s",
                downloadedSize: totalStr,
                eta: "0s",
                status: "extracting" as const
              };
            } else {
              let downloadedSizeStr = "";
              if (totalStr.toLowerCase().includes("gb")) {
                downloadedSizeStr = `${(nextDownloadedMb / 1024).toFixed(1)} GB`;
              } else {
                downloadedSizeStr = `${nextDownloadedMb.toFixed(0)} MB`;
              }

              const remainingMb = totalMb - nextDownloadedMb;
              const remainingSec = Math.ceil(remainingMb / speedMbSec);
              let etaStr = "";
              if (remainingSec > 60) {
                const mins = Math.floor(remainingSec / 60);
                const secs = remainingSec % 60;
                etaStr = `${mins}m ${secs}s`;
              } else {
                etaStr = `${remainingSec}s`;
              }

              return {
                ...d,
                progress: nextProgress,
                downloadSpeed: `${speedMbSec.toFixed(1)} MB/s`,
                downloadedSize: downloadedSizeStr,
                eta: etaStr,
                status: "downloading" as const
              };
            }
          } else if (d.status === "extracting") {
            updated = true;
            const isCompleted = Math.random() > 0.45; // roughly 2 seconds
            if (isCompleted) {
              const cleanTitle = d.game.title.replace(/[^a-zA-Z0-9]/g, "");
              const mockExePath = `C:\\Games\\VoyageLibrary\\${cleanTitle}\\${cleanTitle}.exe`;
              
              // Run automatic linkage mapping
              setTimeout(() => {
                handleAutoInstallToLibrary(d.game, mockExePath);
              }, 10);

              return {
                ...d,
                progress: 100,
                downloadSpeed: "0.0 MB/s",
                eta: "0s",
                status: "completed" as const
              };
            }
          }
          return d;
        });

        return updated ? nextList : prevList;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [downloads, config.settings.downloadCap]);

  // Poll system diagnostics
  useEffect(() => {
    // Clear existing polling mechanism
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }

    // Run first immediate statistics fetch
    triggerStatsPoll();

    // Hook new diagnostics timer bound to settings interval
    const intervalTime = config.settings.systemStatsInterval || 3000;
    statsIntervalRef.current = setInterval(() => {
      triggerStatsPoll();
    }, intervalTime);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [config.settings.systemStatsInterval]);

  // Retro sci-fi keyboard navigator beep synthesizer
  const playRetroSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  // Keyboard navigation controller within Big Picture Mode
  useEffect(() => {
    if (!bigPictureMode) return;

    const handleBigPictureKeys = (e: KeyboardEvent) => {
      const totalLibraryCount = config.library.length;
      if (totalLibraryCount === 0) return;

      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        playRetroSound();
        setBpSelectedIndex((prev) => (prev + 1) % totalLibraryCount);
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        playRetroSound();
        setBpSelectedIndex((prev) => (prev - 1 + totalLibraryCount) % totalLibraryCount);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playRetroSound();
        const activeGame = config.library[bpSelectedIndex];
        if (activeGame) {
          handleLaunchGame(activeGame);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        playRetroSound();
        setBigPictureMode(false);
        addToast("Exited Big Picture controller interface.", "info");
      }
    };

    window.addEventListener("keydown", handleBigPictureKeys);
    return () => {
      window.removeEventListener("keydown", handleBigPictureKeys);
    };
  }, [bigPictureMode, config.library, bpSelectedIndex]);

  // Real-time gamepad connection listeners
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      addToast(`Controller Connected: ${e.gamepad.id}`, "success");
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      addToast(`Controller Disconnected: ${e.gamepad.id}`, "info");
    };

    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

    return () => {
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
      window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
    };
  }, []);

  // Voyage Steer-Helm SDL2 Input Controller Emulative Thread
  useEffect(() => {
    const emulator = Sdl2Emulator.getInstance();
    let lastAxisTime = 0;
    const AXIS_DEBOUNCE_MS = 250;

    // Core Mandate: Handle SDL_CONTROLLERBUTTONDOWN equivalent
    emulator.registerButtonCallback((helmId, btn) => {
      if (!bigPictureMode) {
        // Pressing Start on desktop controller initiates Voyage Fullscreen Launcher
        if (btn === "start") {
          playRetroSound();
          setBigPictureMode(true);
          setBpSelectedIndex(0);
          addToast("Voyage Big Picture Launcher activated via Corsair SDL2 controller!", "success");
        }
        return;
      }

      const totalCount = config.library.length;
      if (totalCount === 0) return;

      playRetroSound();

      if (btn === "dpright" || btn === "rightshoulder" || btn === "y") {
        setBpSelectedIndex((prev) => (prev + 1) % totalCount);
      } else if (btn === "dpleft" || btn === "leftshoulder" || btn === "x") {
        setBpSelectedIndex((prev) => (prev - 1 + totalCount) % totalCount);
      } else if (btn === "a" || btn === "start") {
        const activeGame = config.library[bpSelectedIndex];
        if (activeGame) {
          handleLaunchGame(activeGame);
        }
      } else if (btn === "back" || btn === "b") {
        setBigPictureMode(false);
        addToast("Exited Big Picture deck console.", "info");
      }
    });

    // Core Mandate: Handle SDL_CONTROLLERAXISMOTION equivalent
    emulator.registerAxisCallback((helmId, axisIndex, value) => {
      if (!bigPictureMode) return;
      const now = Date.now();
      if (now - lastAxisTime < AXIS_DEBOUNCE_MS) return;

      const totalCount = config.library.length;
      if (totalCount === 0) return;

      if (axisIndex === 0) { // Horizontal steering (Port / Starboard)
        if (value > 0.4) {
          playRetroSound();
          setBpSelectedIndex((prev) => (prev + 1) % totalCount);
          lastAxisTime = now;
        } else if (value < -0.4) {
          playRetroSound();
          setBpSelectedIndex((prev) => (prev - 1 + totalCount) % totalCount);
          lastAxisTime = now;
        }
      }
    });

    return () => {
      emulator.clearCallbacks();
    };
  }, [bigPictureMode, config.library, bpSelectedIndex]);

  const addToast = (text: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // REST API fetches
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && !data.error) {
          setConfig(data);
        }
      }
    } catch (err) {
      console.warn("Express server offline, fallback to LocalStorage setup.");
      const saved = localStorage.getItem("voyage_config");
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch {
          // ignore parsing flaws
        }
      }
    }
  };

  const fetchGamesList = async () => {
    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          setCatalogGames(list);
        }
      }
    } catch (err) {
      console.error("Failed to query central games index:", err);
    }
  };

  const checkSteamToolsStatus = async () => {
    try {
      const res = await fetch("/api/steamtools/status");
      if (res.ok) {
        const data = await res.json();
        if (data.installed) {
          setSteamToolsInstalled(true);
          try {
            localStorage.setItem("steamtools_installed", "true");
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn("Could not check native SteamTools system status:", err);
    }
  };

  const saveConfig = async (updatedConfig: AppConfig) => {
    setConfig(updatedConfig);
    localStorage.setItem("voyage_config", JSON.stringify(updatedConfig));
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig)
      });
      if (!res.ok) {
        throw new Error("Disk synchronization failed");
      }
    } catch (err) {
      console.warn("Synchronized locally only.");
    }
  };

  const triggerStatsPoll = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const s = await res.json();
        setStats(s);
      }
    } catch (err) {
      // Simulate slight micro-waves if server goes offline
      setStats((prev) => ({
        ...prev,
        cpu: Math.round(10 + Math.random() * 8),
        ram: Math.round(44 + Math.random() * 3),
        uptime: prev.uptime || "1h 14m"
      }));
    }
  };

  // Add Source logic
  const handleAddSource = async (url: string) => {
    setIsLoadingSources(true);
    addToast("Connecting database link...", "info");
    try {
      const res = await fetch("/api/sources/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Refetch games and configuration
        addToast(`Successfully bound repository: ${data.name}`, "success");
        await fetchConfig();
        await fetchGamesList();
      } else {
        addToast(`Integration failed: ${data.error || "Scheme mismatch"}`, "error");
      }
    } catch (err: any) {
      addToast(`System Connection failure: ${err.message || String(err)}`, "error");
    } finally {
      setIsLoadingSources(false);
    }
  };

  // Upload/Import Source directly from JSON on local computer
  const handleUploadSource = async (name: string, downloads: any[]) => {
    setIsLoadingSources(true);
    addToast("Uploading database JSON...", "info");
    try {
      const res = await fetch("/api/sources/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, downloads })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Successfully imported: ${data.name} (${data.count} games)`, "success");
        await fetchConfig();
        await fetchGamesList();
      } else {
        addToast(`Import failed: ${data.error || "Formatting error"}`, "error");
      }
    } catch (err: any) {
      addToast(`System Connection failure: ${err.message || String(err)}`, "error");
    } finally {
      setIsLoadingSources(false);
    }
  };

  // Remove Source and clean up linked games
  const handleRemoveSource = async (source: Source, removeGames: boolean) => {
    try {
      // Filter out source from configuration
      const nextSources = config.sources.filter((s) => s.url !== source.url);
      let nextLibrary = [...config.library];

      if (removeGames) {
        nextLibrary = nextLibrary.filter((g) => g.source !== source.name);
        addToast(`Purged source details and ${config.library.length - nextLibrary.length} local games.`, "info");
      } else {
        addToast(`Removed repository link. Local game shortcuts kept intact.`, "success");
      }

      const nextConfig = {
        ...config,
        sources: nextSources,
        library: nextLibrary
      };

      await saveConfig(nextConfig);
      await fetchGamesList();
      
      // Close detail modal if the game deleted belongs to that source
      if (selectedGame && selectedGame.source === source.name) {
        setSelectedGame(null);
      }
    } catch (err) {
      addToast("Failed to disconnect source correctly", "error");
    }
  };

  // Handle linking local executable shortcut
  const handleLinkExe = async (game: Game, executablePath: string) => {
    const exists = config.library.some((g) => g.title.toLowerCase() === game.title.toLowerCase());
    if (exists) {
      addToast(`Game is already connected to your Library.`, "info");
      return;
    }

    const linkedGame: Game = {
      ...game,
      type: "multiplayer",
      linkPath: executablePath,
      addedDate: new Date().toISOString().split("T")[0]
    };

    const nextConfig = {
      ...config,
      library: [...config.library, linkedGame]
    };

    await saveConfig(nextConfig);
    addToast(`Shortcut saved: "${game.title}" is bound in library.`, "success");
  };

  // Automatically install/map game down status to library
  const handleAutoInstallToLibrary = async (game: Game, exePath: string) => {
    setConfig((prevConfig) => {
      const exists = prevConfig.library.some((g) => g.title.toLowerCase() === game.title.toLowerCase());
      if (exists) return prevConfig;

      const installedGame: Game = {
        ...game,
        type: "multiplayer",
        linkPath: exePath,
        addedDate: new Date().toISOString().split("T")[0]
      };

      const revised = {
        ...prevConfig,
        library: [...prevConfig.library, installedGame]
      };
      
      localStorage.setItem("voyage_config", JSON.stringify(revised));
      fetch("/api/config", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(revised)
      }).catch(err => console.warn("Sync failed, local only", err));

      setTimeout(() => {
        addToast(`Successfully installed & mapped: "${game.title}"! Play now.`, "success");
      }, 100);

      return revised;
    });
  };

  // Download controller actions
  const onPauseDownload = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "paused" } : d))
    );
  };

  const onResumeDownload = (id: string) => {
    setDownloads((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "downloading" } : d))
    );
  };

  const onCancelDownload = (id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  const onClearCompleted = () => {
    setDownloads((prev) => prev.filter((d) => d.status !== "completed" && d.status !== "allocated"));
  };

  const onStartInAppDownload = (game: Game) => {
    const isAlreadyDownloading = downloads.some((d) => d.game.title.toLowerCase() === game.title.toLowerCase());
    if (isAlreadyDownloading) {
      addToast(`"${game.title}" is already in active download stream!`, "info");
      setActiveTab("downloads");
      setSelectedGame(null);
      return;
    }

    const sizeStr = game.fileSize || game.size || "15 GB";
    const newDownload: DownloadItem = {
      id: Date.now().toString() + Math.random().toString(),
      game,
      progress: 0,
      downloadSpeed: "Calculating...",
      downloadedSize: "0 MB",
      totalSize: sizeStr,
      eta: "Calculating...",
      status: "downloading"
    };

    setDownloads((prev) => [newDownload, ...prev]);
    setSelectedGame(null);
    setActiveTab("downloads");
    addToast(`⚡ Direct in-app stream initiated for "${game.title}"!`, "success");
  };

  // Unlink details
  const handleRemoveLink = async (game: Game) => {
    const nextLibrary = config.library.filter((g) => g.title.toLowerCase() !== game.title.toLowerCase());
    const nextConfig = {
      ...config,
      library: nextLibrary
    };
    await saveConfig(nextConfig);
    addToast(`Unlinked code executable for "${game.title}".`, "info");
  };

  // Add a fully custom app manually
  const handleAddManualGame = async (newGame: Game) => {
    // Default any manual additions to multiplayer if unspecified
    const typedGame: Game = {
      ...newGame,
      type: newGame.type || "multiplayer"
    };
    const nextConfig = {
      ...config,
      library: [...config.library, typedGame]
    };
    await saveConfig(nextConfig);
    addToast(`Custom entry shortcut compiled: "${newGame.title}".`, "success");
  };

  const handleToggleSteamToolsInstalled = () => {
    setSteamToolsInstalled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("steamtools_installed", String(next));
      } catch (e) {}
      addToast(next ? "SteamTools Service Agent Connected." : "SteamTools Agent Disconnected.", next ? "success" : "info");
      return next;
    });
  };

  // Simulate launching a private computer process locally
  const handleLaunchGame = (game: Game) => {
    setLaunchingGame(game);
    setLaunchProgress(0);
    
    const messages = [
      `Initializing VM sandbox parameters...`,
      `[Voyager-Helm] SDL_Init(SDL_INIT_GAMECONTROLLER | SDL_INIT_JOYSTICK) -> SUCCESS`,
      `[Voyager-Helm] Mapping database loaded: "/gamecontrollerdb.txt" (Steam Input layout standard)`,
      `[Voyager-Helm] SDL_NumJoysticks() -> Detected active steering gamepads`,
      `[Voyager-Helm] SDL_GameControllerOpen(0) -> Hooked "Xbox/Sony DualSense Translated Input Controller"`,
      `[Voyager-Helm] Routing SDL_CONTROLLERBUTTONDOWN & SDL_CONTROLLERAXISMOTION to local processes`,
      `Loading linked payload path: "${game.linkPath || "N/A"}"`,
      `Injecting network speed profiles (Capping: ${config.settings.downloadCap === 0 ? "Unlimited" : config.settings.downloadCap + " MB/s"})...`,
      `Synchronizing telemetry ports...`,
      `Voyage sandbox operational. Enjoy! 🚀`
    ];

    setLaunchLogs([`BOOT: Triggering process binary launcher...`]);

    let logIdx = 0;
    const progressTimer = setInterval(() => {
      setLaunchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => {
            setLaunchingGame(null);
            addToast(`"${game.title}" launched successfully!`, "success");
          }, 800);
          return 100;
        }

        const step = Math.floor(Math.random() * 15) + 10;
        if (prev % 25 === 0 && logIdx < messages.length) {
          setLaunchLogs((logs) => [...logs, messages[logIdx]]);
          logIdx++;
        }
        return Math.min(100, prev + step);
      });
    }, 300);
  };

  // Reset metrics
  const handleClearCache = () => {
    addToast("Temporary source cache maps purged.", "success");
  };

  const handleFullReset = async () => {
    if (window.confirm("CRITICAL: Resort configurations to factory settings? This isolates catalog maps.")) {
      await saveConfig(DEFAULT_CONFIG);
      addToast("Voyage engine configs initialized to defaults.", "info");
      await fetchGamesList();
      setActiveTab("dashboard");
    }
  };

  const handleCopyMagnetToClipboard = (magnet: string) => {
    try {
      navigator.clipboard.writeText(magnet);
      addToast("Magnet URL copied to device clipboard!", "success");
    } catch {
      // fallback if clipboard API blocked in frames.
      addToast("Failed to copy naturally, check URL.", "info");
    }
  };

  // Map active CSS styles based on active config theme
  const activeTheme = config.settings.theme || "cyan-purple";
  const themeStyle = THEME_PALETTE[activeTheme] || THEME_PALETTE["cyan-purple"];

  return (
    <div 
      id="app-viewport" 
      className="min-h-screen bg-[#000000] text-neutral-100 flex flex-col font-sans select-none overflow-hidden antialiased"
      style={{
        ["--accent-primary" as any]: themeStyle.color,
        ["--accent-primary-glow" as any]: themeStyle.glow,
      }}
    >
      {/* Custom Windows Titlebar */}
      <header className="h-[40px] bg-[#050505] flex items-center px-4 border-b border-white/5 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 22H22L12 2Z" stroke={themeStyle.color} strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="2" fill="#8a2be2" />
            </svg>
          </div>
          <span className="font-display text-[10px] font-bold tracking-widest text-[#00f0ff] uppercase" style={{ color: themeStyle.color }}>VOYAGE v1.0.4</span>
        </div>
        <div className="flex-1"></div>
        
        {/* Big Picture Mode Launcher Button */}
        <button
          onClick={() => {
            playRetroSound();
            setBigPictureMode(true);
            setBpSelectedIndex(0);
            addToast("Launched Big Picture mode for gaming controllers!", "success");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 hover:border-[#00f0ff]/30 text-white border border-white/5 rounded-full text-[10px] font-mono font-bold uppercase cursor-pointer hover:scale-105 transition duration-150 mr-3 shrink-0 select-none"
          title="Switch to Gamepad Big Picture Controller Launcher"
        >
          <Gamepad2 className="w-3.5 h-3.5 shrink-0" style={{ color: themeStyle.color }} />
          <span>Big Picture</span>
        </button>

        {/* Mock OS controls to provide maximum terminal immersion */}
        <div className="flex gap-1 col-span-1">
          <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-white/5 cursor-pointer rounded transition">
            <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/></svg>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-white/5 cursor-pointer rounded transition">
            <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="5" width="14" height="14" rx="1" strokeWidth="2"/></svg>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white cursor-pointer rounded transition">
            <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/></svg>
          </div>
        </div>
      </header>

      {/* Main Structural Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <aside className="w-56 bg-[#050505] border-r border-white/5 flex flex-col justify-between shrink-0 p-4 pt-6 select-none z-10">
          <div className="space-y-8">
            {/* Logo area */}
            <div className="flex items-center gap-3 px-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${themeStyle.gradient} flex items-center justify-center p-[1.5px] shadow-lg`}>
                <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
                  <span className={`text-sm font-bold font-display ${themeStyle.text} tracking-tight`}>V</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-bold font-display tracking-widest text-white block">VOYAGE</span>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 block uppercase">GAMING HUB</span>
              </div>
            </div>

            {/* Menu options */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full text-left px-3.5 py-3 rounded-r-md rounded-l-none text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-3.5 cursor-pointer border-l-2 ${
                  activeTab === "dashboard"
                    ? `bg-white/5 text-[#00f0ff] ${themeStyle.border}`
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.02]"
                }`}
                style={{ color: activeTab === "dashboard" ? themeStyle.color : undefined }}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("discover")}
                className={`w-full text-left px-3.5 py-3 rounded-r-md rounded-l-none text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-3.5 cursor-pointer border-l-2 ${
                  activeTab === "discover"
                    ? `bg-white/5 text-[#00f0ff] ${themeStyle.border}`
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.02]"
                }`}
                style={{ color: activeTab === "discover" ? themeStyle.color : undefined }}
              >
                <Globe className="w-4 h-4" />
                <span>Discover</span>
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`w-full text-left px-3.5 py-3 rounded-r-md rounded-l-none text-xs font-semibold tracking-wide uppercase transition-all flex items-center justify-between cursor-pointer border-l-2 ${
                  activeTab === "library"
                    ? `bg-white/5 text-[#00f0ff] ${themeStyle.border}`
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.02]"
                }`}
                style={{ color: activeTab === "library" ? themeStyle.color : undefined }}
              >
                <div className="flex items-center gap-3.5">
                  <Library className="w-4 h-4" />
                  <span>Library</span>
                </div>
                <span className={`text-[10px] bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-md ${themeStyle.text}`}>
                  {config.library.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("downloads")}
                className={`w-full text-left px-3.5 py-3 rounded-r-md rounded-l-none text-xs font-semibold tracking-wide uppercase transition-all flex items-center justify-between cursor-pointer border-l-2 ${
                  activeTab === "downloads"
                    ? `bg-white/5 text-[#00f0ff] ${themeStyle.border}`
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.02]"
                }`}
                style={{ color: activeTab === "downloads" ? themeStyle.color : undefined }}
              >
                <div className="flex items-center gap-3.5">
                  <Download className="w-4 h-4" />
                  <span>Downloads</span>
                </div>
                {downloads.filter(d => d.status === "downloading" || d.status === "extracting").length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("manifests")}
                className={`w-full text-left px-3.5 py-3 rounded-r-md rounded-l-none text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-3.5 cursor-pointer border-l-2 ${
                  activeTab === "manifests"
                    ? `bg-white/5 text-[#00f0ff] ${themeStyle.border}`
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.02]"
                }`}
                style={{ color: activeTab === "manifests" ? themeStyle.color : undefined }}
              >
                <Layers className="w-4 h-4" />
                <span>Manifests</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full text-left px-3.5 py-3 rounded-r-md rounded-l-none text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-3.5 cursor-pointer border-l-2 ${
                  activeTab === "settings"
                    ? `bg-white/5 text-[#00f0ff] ${themeStyle.border}`
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.02]"
                }`}
                style={{ color: activeTab === "settings" ? themeStyle.color : undefined }}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Immersive System Status Indicator Widget in Sidebar */}
          <div className="mt-auto">
            <div 
              className="p-4 glass-panel rounded-lg border"
              style={{ borderColor: `${themeStyle.color}33` }} // ~20% opacity matching #00f0ff/20
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" style={{ backgroundColor: themeStyle.color }}></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-display">System Status</span>
              </div>
              <div className="text-[11px] font-mono leading-relaxed space-y-1">
                <div className="flex justify-between pb-1 border-b border-white/5">
                  <span className="text-neutral-500">Uptime:</span>
                  <span className="text-white font-bold">{stats.uptime}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-white/5">
                  <span className="text-neutral-500">CPU Load:</span>
                  <span className="text-white font-bold">{stats.cpu}%</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-white/5">
                  <span className="text-neutral-500">RAM Usage:</span>
                  <span className="text-white font-bold">{stats.ram}%</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-neutral-400 font-semibold">Status:</span>
                  <span className="font-bold text-[#00f0ff]" style={{ color: themeStyle.color }}>SECURED</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content canvas viewport */}
        <main className="flex-1 overflow-y-auto p-8 relative flex flex-col justify-start bg-gradient-to-br from-[#0a0a0a] to-[#000000]">
          {/* Dashboard Panel View */}
          {activeTab === "dashboard" && (
            <DashboardPanel
              stats={stats}
              recentGames={config.library.slice(0, 3)}
              onLaunchGame={handleLaunchGame}
              onNavigate={(tab) => setActiveTab(tab as any)}
              themeStyle={themeStyle}
              libraryCount={config.library.length}
            />
          )}

          {/* Discover Catalog Panel View */}
          {activeTab === "discover" && (
            <DiscoverPanel
              games={catalogGames}
              sources={config.sources}
              onSelectGame={(g) => setSelectedGame(g)}
              isLoading={isLoadingSources}
              themeStyle={themeStyle}
            />
          )}

          {/* Library Games Panel View */}
          {activeTab === "library" && (
            <LibraryPanel
              library={config.library}
              onLaunchGame={handleLaunchGame}
              onRemoveGame={handleRemoveLink}
              onAddLocalGame={handleAddManualGame}
              themeStyle={themeStyle}
            />
          )}

          {/* Settings Control Panel View */}
          {activeTab === "settings" && (
            <SettingsPanel
              config={config}
              onUpdateSettings={(updated) => saveConfig({ ...config, settings: updated })}
              onAddSource={handleAddSource}
              onUploadSource={handleUploadSource}
              onRemoveSource={handleRemoveSource}
              onClearCache={handleClearCache}
              onFullReset={handleFullReset}
              isLoading={isLoadingSources}
              themeStyle={themeStyle}
            />
          )}

                    {/* Steam Manifests Panel View */}
          {activeTab === "manifests" && (
            <ManifestsPanel
              onAddGameToLibrary={handleAddManualGame}
              library={config.library}
              themeStyle={themeStyle}
              steamToolsInstalled={steamToolsInstalled}
              onToggleSteamToolsInstalled={handleToggleSteamToolsInstalled}
            />
          )}

          {/* Voyage Downloads Panel View */}
          {activeTab === "downloads" && (
            <DownloadsPanel
              downloads={downloads}
              onPauseDownload={onPauseDownload}
              onResumeDownload={onResumeDownload}
              onCancelDownload={onCancelDownload}
              onClearCompleted={onClearCompleted}
              themeStyle={themeStyle}
              downloadCap={config.settings.downloadCap}
            />
          )}
        </main>
      </div>

      {/* Game Details Overlay dialog */}
      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onLinkExe={handleLinkExe}
          onRemoveLink={handleRemoveLink}
          isGameInLibrary={config.library.some((g) => g.title.toLowerCase() === selectedGame.title.toLowerCase())}
          linkedPath={config.library.find((g) => g.title.toLowerCase() === selectedGame.title.toLowerCase())?.linkPath}
          themeStyle={themeStyle}
          onCopyMagnet={handleCopyMagnetToClipboard}
          onStartInAppDownload={onStartInAppDownload}
        />
      )}

      {/* Big Picture Mode Fullscreen UI */}
      {bigPictureMode && (
        <div className="fixed inset-0 bg-[#030303] bg-[radial-gradient(circle_at_center,rgba(5,15,30,0.85)_0%,rgba(1,1,1,0.99)_100%)] z-[90] flex flex-col justify-between p-8 text-left select-none animate-fade-in overflow-hidden">
          
          {/* BP Top Status Bar */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Gamepad2 className="w-5.5 h-5.5 text-white" style={{ color: themeStyle.color }} />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#00f0ff] uppercase block" style={{ color: themeStyle.color }}>VOYAGE DECK CONSOLE</span>
                <span className="text-sm font-bold font-display text-white uppercase tracking-tight">BIG PICTURE HANDHELD LAUNCHER</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Controller Help Ribbon */}
              <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-mono text-neutral-400">
                <span className="flex items-center gap-1"><kbd className="bg-neutral-800 text-white px-1 py-0.5 rounded border border-white/10 font-bold">A/D</kbd> or <kbd className="bg-neutral-800 text-white px-1 py-0.5 rounded border border-white/10 font-bold">←/→</kbd> Navigate</span>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <span className="flex items-center gap-1"><kbd className="bg-neutral-800 text-white px-1.5 py-0.5 rounded border border-white/10 font-bold">ENTER</kbd> Play</span>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <span className="flex items-center gap-1"><kbd className="bg-neutral-800 text-white px-1 py-0.5 rounded border border-white/10 font-bold">ESC</kbd> Exit</span>
              </div>

              {/* Live Hours clock */}
              <div className="text-right">
                <span className="text-xs text-neutral-500 font-mono tracking-wider block uppercase">SYSTEM STATUS</span>
                <span className="text-xs font-mono font-bold text-white uppercase">{stats.uptime} ACTIVE</span>
              </div>
            </div>
          </div>

          {/* BP Carousel Section */}
          <div className="flex-1 my-6 flex flex-col justify-center overflow-x-auto overflow-y-hidden py-4 max-w-full">
            {config.library.length === 0 ? (
              <div className="w-full max-w-md mx-auto text-center border border-dashed border-white/10 p-12 rounded-3xl bg-neutral-900/40 backdrop-blur-sm">
                <Gamepad2 className="w-12 h-12 text-neutral-600 mx-auto mb-4 animate-bounce" />
                <h3 className="font-bold text-white text-lg">Your Game Library is Empty</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  There are no game executables bound to list on Big Picture console. Back to the standard workspace navigation to sync single player manifests or link multiplayer shortcuts.
                </p>
                <button
                  onClick={() => setBigPictureMode(false)}
                  className="mt-6 px-6 py-2.5 bg-white text-black font-semibold text-xs font-mono rounded-xl uppercase hover:scale-105 transition duration-240 cursor-pointer"
                >
                  Return to Desktop Workspace [ESC]
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center font-mono text-xs text-neutral-400 mb-2">
                  EXPLORING <strong className="text-white font-normal uppercase">{config.library.length} short-cut shortcuts</strong> INSTALLED
                </div>
                
                {/* Side Scrolling Deck */}
                <div className="flex gap-6 justify-center items-center px-8">
                  {config.library.map((g, idx) => {
                    const isSelected = idx === bpSelectedIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          playRetroSound();
                          setBpSelectedIndex(idx);
                        }}
                        className={`w-72 h-[340px] shrink-0 glass-panel border rounded-2xl p-6 flex flex-col justify-between text-left transition-all duration-300 transform cursor-pointer relative ${
                          isSelected ? "scale-105" : "scale-90 opacity-40 hover:opacity-75"
                        }`}
                        style={{
                          borderColor: isSelected ? themeStyle.color : "rgba(255, 255, 255, 0.05)",
                          boxShadow: isSelected ? `0 0 35px ${themeStyle.glow}` : undefined
                        }}
                      >
                        {/* Selected overlay tag indicator */}
                        {isSelected && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[9px] font-bold font-mono text-black uppercase tracking-widest scale-100" style={{ backgroundColor: themeStyle.color }}>
                            CURRENT SELECTION
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-white/5 border border-white/10 text-neutral-400 font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                              {g.source}
                            </span>
                            <span className={`text-[10px] font-mono font-semibold uppercase ${g.type === "singleplayer" ? "text-amber-400" : "text-purple-400"}`}>
                              {g.type === "singleplayer" ? "SINGLE PLAYER" : "MULTIPLAYER"}
                            </span>
                          </div>

                          {/* Decorative Console Cover art image */}
                          <div className="h-28 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center p-4 relative overflow-hidden group">
                            {/* Neon glowing backdrop elements */}
                            <div className="absolute inset-0 bg-gradient-to-tr opacity-20" style={{ backgroundImage: `linear-gradient(to top right, ${themeStyle.color}, transparent)` }} />
                            <div className="relative text-center space-y-1 z-10">
                              <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">CONSOLE CARTRIDGE</span>
                              <span className="text-[11px] font-bold text-white uppercase tracking-tight truncate max-w-[180px] block">
                                {g.title}
                              </span>
                            </div>
                            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-neutral-600 uppercase">VOY-0{idx+1}</div>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-base font-bold text-white uppercase tracking-tight truncate pt-1 leading-none">
                              {g.title}
                            </h2>
                            <p className="text-[10px] text-neutral-500 font-mono truncate">
                              Path: {g.linkPath || "Virtual Cloud Deck"}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Action Key Map bar */}
                        <div className="border-t border-white/5 pt-3 mt-1 shrink-0 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">
                            {g.fileSize || "10 GB"}
                          </span>
                          {isSelected ? (
                            <span className="text-[10px] font-mono font-bold uppercase animate-pulse" style={{ color: themeStyle.color }}>
                              [ENTER] LAUNCH
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-mono uppercase font-bold">
                              CLICK TO FOCUS
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* BP Bottom Control Bar */}
          <div className="border-t border-white/10 pt-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                DECK RUNTIME ENGINE INTEGRATED • DIRECT-INPUT DETECTED
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setBigPictureMode(false)}
                className="px-6 py-2.5 border border-white/10 hover:border-white/20 bg-neutral-900/60 text-neutral-300 hover:text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Exit Game Deck [ESC]
              </button>
              
              {config.library[bpSelectedIndex] && (
                <button
                  onClick={() => {
                    playRetroSound();
                    handleLaunchGame(config.library[bpSelectedIndex]);
                  }}
                  className={`px-8 py-2.5 text-black font-semibold text-xs font-mono rounded-xl uppercase hover:scale-105 hover:brightness-110 tracking-wider transition duration-150 cursor-pointer`}
                  style={{ backgroundColor: themeStyle.color }}
                >
                  Launch Game [ENTER]
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Holographic Launcher Overlay Simulator */}
      {launchingGame && (
        <div className="fixed inset-0 bg-[#020202] z-[100] flex flex-col justify-center items-center p-6 text-left border-t-2 border-[#00f0ff] box-glow selection:bg-neutral-800 animate-fade-in select-none">
          <div className="w-full max-w-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-[#00f0ff] uppercase block">
                  VOYAGE PROCESS VM LAUNCHER
                </span>
                <h2 className="text-xl font-bold font-display text-white">
                  Launching {launchingGame.title}
                </h2>
              </div>
              <Terminal className="w-8 h-8 text-[#00f0ff] animate-pulse" />
            </div>

            {/* Launch loading visualizer */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                <span>SIMULATED LOAD MEMORY BUFFER</span>
                <span className="font-mono">{launchProgress}%</span>
              </div>
              <div className="h-2 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00f0ff] duration-300 transition-all shadow-[0_0_10px_#00f0ff] rounded-full"
                  style={{ width: `${launchProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Simulated execution terminal logs */}
            <div className="bg-neutral-950 border border-white/5 p-4 rounded-lg font-mono text-xs text-neutral-500 space-y-1 h-36 overflow-y-auto w-full select-text selection:bg-neutral-800">
              {launchLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className={`text-[10px] ${themeStyle.text}`}>&gt;</span>
                  <span className={`${idx === launchLogs.length - 1 ? "text-neutral-100" : ""}`}>{log}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center font-mono text-[10px] text-neutral-500 pt-2 animate-pulse">
              STANDBY... SECURING RUNTIME HANDLER
            </div>
          </div>
        </div>
      )}

      {/* Toast Overlay Alerts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-max sm:w-80 p-3.5 bg-neutral-900 border-l-[3.5px] rounded-r-lg shadow-xl flex items-start gap-3 pointer-events-auto scale-100 cursor-pointer animate-slide-in select-none ${
              toast.type === "success"
                ? "border-emerald-500 text-emerald-400"
                : toast.type === "error"
                ? "border-red-500 text-red-500"
                : `border-[#00f0ff] ${themeStyle.text}`
            }`}
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            <Info className="w-4.5 h-4.5 shrink-0 select-none" />
            <span className="text-xs font-mono font-medium leading-normal block select-none">
              {toast.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
