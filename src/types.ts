export interface DownloadItem {
  id: string;
  game: Game;
  progress: number; // 0 to 100
  downloadSpeed: string; // e.g., "12.4 MB/s"
  downloadedSize: string; // e.g., "4.2 GB"
  totalSize: string; // e.g., "45.0 GB"
  eta: string; // e.g., "12m 4s"
  status: "downloading" | "paused" | "extracting" | "completed" | "allocated";
}

export interface Game {
  title: string;
  source: string;
  type?: "singleplayer" | "multiplayer"; // Multiplayer are from Discover (SteamRip etc), Singleplayer are Manifest games (SteamTools)
  fileSize?: string;
  size?: string;
  magnet?: string;
  downloadUrl?: string;
  linkPath?: string; // Linked executable path for local library apps
  addedDate?: string;
  downloads?: Array<{
    name: string;
    url: string;
    magnet?: string;
  }>;
}

export interface Source {
  name: string;
  url: string;
  addedDate: string;
}

export interface Settings {
  theme: "cyan-purple" | "emerald" | "crimson" | "gold";
  systemStatsInterval: number; // in milliseconds
  downloadCap: number; // 0 for Unlimited, or positive number for MB/s cap
}

export interface AppConfig {
  sources: Source[];
  library: Game[];
  settings: Settings;
}

export interface SystemStats {
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  os: string;
}
