import React, { useState, useEffect } from "react";
import { Sdl2Emulator, HelmDevice } from "../utils/sdl2Emulator";
import { Gamepad2, Compass, ShieldAlert, Anchor, Wind, HelpCircle, HardDriveDownload } from "lucide-react";

interface HelmDiagnosticsProps {
  themeStyle: any;
}

export default function HelmDiagnostics({ themeStyle }: HelmDiagnosticsProps) {
  const [helms, setHelms] = useState<HelmDevice[]>([]);
  const [dbStatus, setDbStatus] = useState<string>("INITIALIZING");
  const [lastInputEvent, setLastInputEvent] = useState<{
    id: number;
    btn: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const emulator = Sdl2Emulator.getInstance();
    
    // Poll the active helms state every 100ms for visual diagnostic output
    const timer = setInterval(() => {
      setHelms(emulator.getActiveHelms());
    }, 100);

    // Register simple diagnostic listener to capture press feedback
    emulator.registerButtonCallback((helmId, btn) => {
      setLastInputEvent({
        id: helmId,
        btn: btn,
        timestamp: Date.now()
      });
    });

    // Check mapping size to confirm database parse
    const count = Object.keys((emulator as any).mappingsDatabase || {}).length;
    if (count > 0) {
      setDbStatus("ACTIVE (LOADED gamecontrollerdb.txt)");
    } else {
      setDbStatus("ACTIVE (GENERIC FALLBACK LEDGER)");
    }

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Map Xbox/DualShock actions to pirate terms
  const getPirateTerm = (btn: string) => {
    switch (btn) {
      case "a": return "CAST ANCHOR (Confirm / Select)";
      case "b": return "RETREAT PLANK (Cancel / Exit)";
      case "x": return "FIRE CANNONS (Secondary Action)";
      case "y": return "RAISE SAILS (Category Options)";
      case "start": return "HELM LOGBOOK (Activate Big Picture Deck)";
      case "back": return "LOOKOUT COMPASS (System Status Menu)";
      case "dpup": return "WIND VANE UP (Navigate Up)";
      case "dpdown": return "WIND VANE DOWN (Navigate Down)";
      case "dpleft": return "WIND VANE LEFT (Navigate Left)";
      case "dpright": return "WIND VANE RIGHT (Navigate Right)";
      case "leftshoulder": return "STEER PORT (Previous Page)";
      case "rightshoulder": return "STEER STARBOARD (Next Page)";
      default: return btn.toUpperCase();
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4 text-left border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4.5 h-4.5" style={{ color: themeStyle.color }} />
          <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-neutral-300">
            Voyge Steer-Helm Diagnostics (SDL2 Engine)
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 uppercase">
          Steam Input Mode ACTIVE
        </span>
      </div>

      {/* Driver metadata */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-2.5 bg-black/40 rounded border border-white/5">
          <span className="text-[9px] text-neutral-500 uppercase font-bold block">SDL Driver Mode</span>
          <span className="text-white">SDL_INIT_GAMECONTROLLER</span>
        </div>
        <div className="p-2.5 bg-black/40 rounded border border-white/5">
          <span className="text-[9px] text-neutral-500 uppercase font-bold block">Ledger Mapping Database</span>
          <span className="text-neutral-300 truncate block" title={dbStatus}>
            {dbStatus}
          </span>
        </div>
      </div>

      {/* Active controllers list */}
      <div className="space-y-3 pt-1">
        <span className="text-[10px] uppercase font-bold text-neutral-500 font-mono tracking-wider block">Connected Steering Helms ({helms.length})</span>
        
        {helms.length === 0 ? (
          <div className="bg-[#050505] border border-dashed border-white/5 p-6 rounded-lg text-center font-mono text-xs text-neutral-500">
            <Compass className="w-7 h-7 mx-auto mb-2 text-neutral-700 animate-spin-slow" />
            <span className="uppercase">Scanning Harbor for Controllers...</span>
            <p className="text-[10px] text-neutral-600 mt-1">
              Connect any USB/Bluetooth game controller (Xbox, PS5, Switch) to steer this vessel.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {helms.map((h) => (
              <div key={h.index} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                
                {/* Device Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0">
                      <Gamepad2 className="w-3.5 h-3.5" style={{ color: themeStyle.color }} />
                    </div>
                    <span className="text-xs font-bold text-white truncate uppercase font-sans tracking-wide">
                      {h.name.replace(/(\(.*?Vendor.*?Product.*?\))/g, "").trim()}
                    </span>
                  </div>
                  
                  <span className="text-[9px] font-mono whitespace-nowrap px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400">
                    GUID: {h.guid.slice(0, 16)}...
                  </span>
                </div>

                {/* Real-time Axes and Button Mappings grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                  
                  {/* Axis Compass tracking */}
                  <div className="p-2.5 bg-neutral-900/60 rounded border border-white/5 space-y-1.5">
                    <span className="text-[9px] text-neutral-500 uppercase font-bold block">Ship Wheel (Axes Status)</span>
                    <div className="space-y-1">
                      {h.axes.map((val, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                          <span>Wheel Axis {idx} (Compass):</span>
                          <span className={`font-bold ${Math.abs(val) > 0.15 ? "text-emerald-400" : "text-neutral-400"}`}>
                            {val.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Button status ledger mapping translation */}
                  <div className="p-2.5 bg-neutral-900/60 rounded border border-white/5 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold block">Translated Marine Commands</span>
                      <div className="text-[10px] text-neutral-400 mt-1 text-left line-clamp-2">
                        {h.sdl2Mapped ? (
                          <span className="text-emerald-400 font-bold uppercase">Mapped via gamecontrollerdb.txt</span>
                        ) : (
                          <span className="text-amber-500 font-bold uppercase">Unmapped - Emulation Fallback Enabled</span>
                        )}
                        <span className="block text-neutral-500 mt-0.5 max-w-full text-[9px] truncate">
                          Platform bindings match: SDL_INIT_GAMECONTROLLER API
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Input Feed Logger */}
      {lastInputEvent && (
        <div className="bg-[#050505] p-3 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono animate-fade-in">
          <div className="flex items-center gap-2">
            <Anchor className="w-3.5 h-3.5 text-neutral-400 shrink-0" style={{ color: themeStyle.color }} />
            <span className="text-neutral-400">Command Executed:</span>
            <strong className="text-white uppercase tracking-wider">{getPirateTerm(lastInputEvent.btn)}</strong>
          </div>
          <span className="text-[9px] text-neutral-500 uppercase">
            HELM {lastInputEvent.id} • LIVE
          </span>
        </div>
      )}
    </div>
  );
}
