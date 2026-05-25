/**
 * =================================================================================
 *                 VOYAGE CORSAIR HELM ENGINE - SDL2 BROWSER EMULATOR
 * =================================================================================
 * Emulates the native C++ SDL2 input controller pipeline directly in the browser!
 * This enables the UI's "Big Picture Mode" to be perfectly navigable with actual 
 * controllers while checking and parsing "gamecontrollerdb.txt" mapping logs.
 * 
 * Pirate Metaphors Included:
 * - Helms = Game controllers (Xbox, PS5, Deck)
 * - Sails & Anchor = Start & Select / Face Actions
 * - Compass = Joystick axes
 * =================================================================================
 */

export interface TranslatedHelmInput {
  buttonName: string; // "a" | "b" | "x" | "y" | "start" | "back" | "dpup" | "dpdown" | "dpleft" | "dpright" | "leftshoulder" | "rightshoulder"
  type: "button" | "axis" | "hat";
  sourceIndex: number;
  magnitude: number;
}

export interface HelmDevice {
  index: number;
  name: string;
  guid: string;
  originalId: string;
  sdl2Mapped: boolean;
  mappings: Record<string, string>; // Translated buttons under standard gamecontrollerdb
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
}

export class Sdl2Emulator {
  private static instance: Sdl2Emulator | null = null;
  private mappingsDatabase: Record<string, Record<string, string>> = {};
  private activeHelms: HelmDevice[] = [];
  private onButtonDownCallbacks: Array<(helmId: number, btn: string) => void> = [];
  private onAxisMotionCallbacks: Array<(helmId: number, axisIndex: number, magnitude: number) => void> = [];
  private rafId: number | null = null;
  private lastButtonState: Record<number, Record<string, boolean>> = {};

  private constructor() {
    this.bootSdl2InputPipeline();
  }

  public static getInstance(): Sdl2Emulator {
    if (!Sdl2Emulator.instance) {
      Sdl2Emulator.instance = new Sdl2Emulator();
    }
    return Sdl2Emulator.instance;
  }

  /**
   * SDL2 Core Initialization: Emulates SDL_INIT_GAMECONTROLLER
   */
  public async bootSdl2InputPipeline() {
    console.log("[Corsair-Sdl2] Initializing Core: SDL_INIT_GAMECONTROLLER");
    
    // Fetch and read local gamecontrollerdb.txt database
    try {
      const resp = await fetch("/gamecontrollerdb.txt");
      if (resp.ok) {
        const txt = await resp.text();
        this.parseSdl2Database(txt);
        console.log(`[Corsair-Sdl2] Loaded ${Object.keys(this.mappingsDatabase).length} native controller schemas from gamecontrollerdb.txt!`);
      } else {
        console.warn("[Corsair-Sdl2] Failed to fetch gamecontrollerdb.txt. Loading default fallback ledgers.");
        this.loadDefaultLedgerFallbacks();
      }
    } catch (e) {
      console.error("[Corsair-Sdl2] Error loading ledgerdb, fallback enabled:", e);
      this.loadDefaultLedgerFallbacks();
    }

    // Start polling loop
    this.startSdl2EventLoop();
  }

  /**
   * Parse real SDL2 mappings string structure
   */
  private parseSdl2Database(content: string) {
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const segments = trimmed.split(",");
      if (segments.length < 3) continue;

      const guid = segments[0].toLowerCase().trim();
      const name = segments[1].trim();
      
      const mappings: Record<string, string> = {};
      for (let i = 2; i < segments.length; i++) {
        const pair = segments[i].trim();
        if (!pair) continue;
        const parts = pair.split(":");
        if (parts.length === 2) {
          mappings[parts[0]] = parts[1]; // e.g. "a" -> "b0" (button 0), "leftx" -> "a0" (axis 0)
        }
      }

      this.mappingsDatabase[guid] = mappings;
    }
  }

  private loadDefaultLedgerFallbacks() {
    // Basic fallback maps matching Xbox and PS controllers
    this.mappingsDatabase["generic"] = {
      "a": "b0", "b": "b1", "x": "b2", "y": "b3",
      "leftshoulder": "b4", "rightshoulder": "b5",
      "back": "b6", "start": "b7",
      "dpup": "h0.1", "dpdown": "h0.4", "dpleft": "h0.8", "dpright": "h0.2",
      "leftx": "a0", "lefty": "a1", "rightx": "a2", "righty": "a3"
    };
  }

  /**
   * Extract a mock or HTML5 controller GUID signature
   */
  public deriveSdl2Guid(idString: string): string {
    // Convert browser string (containing vendor and product ID) into 32-letter hexadecimal SDL GUID payload
    const hexRegex = /([0-9a-fA-F]{4})[-_]([0-9a-fA-F]{4})/g;
    const match = hexRegex.exec(idString);
    if (match) {
      const vendor = match[1].toLowerCase();
      const product = match[2].toLowerCase();
      return `03000000${vendor}00000000${product}00000000`; // Standard mapping GUID alignment
    }
    // Return mock alignment fallback
    if (idString.toLowerCase().includes("xbox")) return "030000005e040000120b000007050000";
    if (idString.toLowerCase().includes("playstation") || idString.toLowerCase().includes("wireless controller")) {
      return "030000004c050000cc09000000000000";
    }
    return "generic";
  }

  /**
   * Listen for key down and translation inputs
   */
  public registerButtonCallback(cb: (id: number, btn: string) => void) {
    this.onButtonDownCallbacks.push(cb);
  }

  public registerAxisCallback(cb: (id: number, axisIndex: number, val: number) => void) {
    this.onAxisMotionCallbacks.push(cb);
  }

  /**
   * Unregister handlers
   */
  public clearCallbacks() {
    this.onButtonDownCallbacks = [];
    this.onAxisMotionCallbacks = [];
  }

  /**
   * The continuous SDL2 Event loop polling navigator gamepads
   */
  private startSdl2EventLoop() {
    const poll = () => {
      this.pollSdl2Joysticks();
      this.rafId = requestAnimationFrame(poll);
    };
    poll();
  }

  /**
   * Core execution of SDL_NumJoysticks and SDL_IsGameController equivalent tracking.
   */
  private pollSdl2Joysticks() {
    if (!navigator.getGamepads) return;
    const rawGamepads = navigator.getGamepads();
    const updatedHelms: HelmDevice[] = [];

    for (let i = 0; i < rawGamepads.length; i++) {
      const gp = rawGamepads[i];
      if (!gp || !gp.connected) continue;

      const guid = this.deriveSdl2Guid(gp.id);
      const isSdl2Configured = !!this.mappingsDatabase[guid] || guid === "generic";
      const actualMappings = this.mappingsDatabase[guid] || this.mappingsDatabase["generic"] || {};

      const device: HelmDevice = {
        index: gp.index,
        name: gp.id,
        guid: guid,
        originalId: gp.id,
        sdl2Mapped: isSdl2Configured,
        mappings: actualMappings,
        buttons: gp.buttons.map(b => ({ pressed: b.pressed, value: b.value })),
        axes: [...gp.axes]
      };

      updatedHelms.push(device);
      this.evaluateSdl2Events(device);
    }

    this.activeHelms = updatedHelms;
  }

  /**
   * Translates active HTML5 controller indices to emulated SDL_CONTROLLERBUTTONDOWN 
   * and SDL_CONTROLLERAXISMOTION events by reference translation.
   */
  private evaluateSdl2Events(device: HelmDevice) {
    const list = device.buttons;
    const mappings = device.mappings;
    const helmIndex = device.index;

    if (!this.lastButtonState[helmIndex]) {
      this.lastButtonState[helmIndex] = {};
    }

    // Key map configurations from gamecontrollerdb translations
    // Example: "a" mapping can point to "b0" (button index 0)
    const translateKeys = ["a", "b", "x", "y", "back", "start", "leftshoulder", "rightshoulder", "dpup", "dpdown", "dpleft", "dpright"];
    
    translateKeys.forEach(key => {
      const bindingStr = mappings[key];
      if (!bindingStr) return;

      let pressed = false;

      if (bindingStr.startsWith("b")) {
        // Direct Button Binding
        const buttonIdx = parseInt(bindingStr.slice(1), 10);
        if (list[buttonIdx]) {
          pressed = list[buttonIdx].pressed;
        }
      } else if (bindingStr.startsWith("h")) {
        // Hat (DPAD Mapping) e.g., "h0.1" for up, "h0.4" for down
        // On web gamepad, Dpad is usually maps directly to buttons 12 (up), 13 (down), 14 (left), 15 (right)
        if (key === "dpup" && list[12]) pressed = list[12].pressed;
        if (key === "dpdown" && list[13]) pressed = list[13].pressed;
        if (key === "dpleft" && list[14]) pressed = list[14].pressed;
        if (key === "dpright" && list[15]) pressed = list[15].pressed;
      }

      const previouslyPressed = !!this.lastButtonState[helmIndex][key];
      if (pressed && !previouslyPressed) {
        // Trigger emulated SDL_CONTROLLERBUTTONDOWN Event
        this.onButtonDownCallbacks.forEach(cb => cb(helmIndex, key));
      }
      this.lastButtonState[helmIndex][key] = pressed;
    });

    // Handle Axis translations (Compass / steering stick coordinate ranges)
    // Map standard left stick movement for Big Picture horizontal navigate
    const leftXVal = mappersGetNormalizedAxis(device, "leftx", 0);
    const leftYVal = mappersGetNormalizedAxis(device, "lefty", 1);

    if (Math.abs(leftXVal) > 0.3) {
      this.onAxisMotionCallbacks.forEach(cb => cb(helmIndex, 0, leftXVal));
    }
    if (Math.abs(leftYVal) > 0.3) {
      this.onAxisMotionCallbacks.forEach(cb => cb(helmIndex, 1, leftYVal));
    }
  }

  public getActiveHelms(): HelmDevice[] {
    return this.activeHelms;
  }

  public dismantle() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

function mappersGetNormalizedAxis(device: HelmDevice, key: string, fallbackIdx: number): number {
  const binding = device.mappings[key];
  if (binding && binding.startsWith("a")) {
    const axisIdx = parseInt(binding.slice(1), 10);
    if (device.axes[axisIdx] !== undefined) {
      return device.axes[axisIdx];
    }
  }
  return device.axes[fallbackIdx] || 0;
}
