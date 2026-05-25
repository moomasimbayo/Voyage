/**
 * =================================================================================
 *                 VOYAGE DESKTOP COMPANION - CORSAIR DECK HELM ENGINE
 * =================================================================================
 * Native C++ SDL2 Controller Translation Pipeline.
 * 
 * This file implements the Steam Input-inspired SDL2 controller driver.
 * It integrates SDL.h, SDL_gamecontroller.h, and SDL_joystick.h to initialize, 
 * detect, map, and process gamepad events using standard gamecontrollerdb.txt assets.
 * 
 * Compilation command (Local GCC/Clang on Desktop systems):
 *   g++ -O3 -shared -fPIC -o voyager_helm.so sdl2_helm_input.cpp -lSDL2
 * =================================================================================
 */

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <SDL2/SDL.h>
#include <SDL2/SDL_joystick.h>
#include <SDL2/SDL_gamecontroller.h>

// Therminology: Pirates & Voyages
// Helm = Controller Input Hub
// Compass = Steering axes (Joystick)
// Sails = Back/Start menu bindings
// Anchor = Launch (Action buttons)

struct Sdl2HelmState {
    bool is_initialized = false;
    std::vector<SDL_GameController*> active_helms;
    std::map<int, std::string> helm_names;
};

static Sdl2HelmState g_helm_state;

/**
 * Initialize Corsair Deck Helm Input sub-systems.
 * Binds deep SDL_Init values and loads compiled mapping databases.
 */
extern "C" bool init_helm_engine(const char* db_path) {
    std::cout << "[Voyager-Helm] Casting Anchor... Initializing Native SDL2 Joysticks & Game Controllers..." << std::endl;
    
    // Core Mandate: Initialize with SDL_INIT_GAMECONTROLLER and SDL_INIT_JOYSTICK
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER) < 0) {
        std::cerr << "[Voyager-Helm] Failed to cast anchor: SDL_Init Error: " << SDL_GetError() << std::endl;
        return false;
    }

    g_helm_state.is_initialized = true;

    // Load custom gamecontrollerdb.txt mapping for translated bindings
    if (db_path != nullptr) {
        std::cout << "[Voyager-Helm] Loading Ledger of Helms from: " << db_path << std::endl;
        int loaded_mappings = SDL_GameControllerAddMappingsFromFile(db_path);
        if (loaded_mappings < 0) {
            std::cerr << "[Voyager-Helm] Warning: Could not parse ledger mappings: " << SDL_GetError() << std::endl;
        } else {
            std::cout << "[Voyager-Helm] Successfully cataloged " << loaded_mappings << " vessel maps into memory." << std::endl;
        }
    }

    return true;
}

/**
 * Scan harbor and detect all game controller devices currently tethered to host system.
 * Employs SDL_NumJoysticks and SDL_IsGameController.
 */
extern "C" int scan_tethered_helms() {
    if (!g_helm_state.is_initialized) return 0;

    // Close previously opened helms to avoid redundant memory allocations
    for (auto* controller : g_helm_state.active_helms) {
        if (controller && SDL_GameControllerGetAttached(controller)) {
            SDL_GameControllerClose(controller);
        }
    }
    g_helm_state.active_helms.clear();
    g_helm_state.helm_names.clear();

    // Core Mandate: Detect controllers with SDL_NumJoysticks
    int total_devices = SDL_NumJoysticks();
    std::cout << "[Voyager-Helm] Scanning harbor... Detected " << total_devices << " devices attached to lines." << std::endl;

    int active_controller_count = 0;

    for (int i = 0; i < total_devices; ++i) {
        // Core Mandate: Check with SDL_IsGameController
        if (SDL_IsGameController(i)) {
            // Core Mandate: Open controller using SDL_GameControllerOpen
            SDL_GameController* controller = SDL_GameControllerOpen(i);
            if (controller) {
                const char* controller_name = SDL_GameControllerName(controller);
                std::string name_str = controller_name ? controller_name : "Unknown Sailor Controller";
                
                g_helm_state.active_helms.push_back(controller);
                g_helm_state.helm_names[active_controller_count] = name_str;
                
                std::cout << "[Voyager-Helm] Tethered controller [" << active_controller_count << "] Name: " << name_str << std::endl;
                active_controller_count++;
            }
        } else {
            std::cout << "[Voyager-Helm] Device [" << i << "] is a native joystick but cannot be translated with current mappings." << std::endl;
        }
    }

    return active_controller_count;
}

/**
 * Return controller name for diagnostic panels.
 */
extern "C" const char* get_helm_name(int controller_idx) {
    if (g_helm_state.helm_names.find(controller_idx) != g_helm_state.helm_names.end()) {
        return g_helm_state.helm_names[controller_idx].c_str();
    }
    return "Disconnected Helm";
}

/**
 * Event polling dispatch. Converts SDL_CONTROLLERBUTTONDOWN and SDL_CONTROLLERAXISMOTION 
 * to serialized JSON tokens or standard stdout alerts.
 */
extern "C" void poll_deck_events(void (*event_callback)(int controller_id, const char* event_type, int code, double magnitude)) {
    if (!g_helm_state.is_initialized || event_callback == nullptr) return;

    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        // Core Mandate: Handle SDL_CONTROLLERBUTTONDOWN & SDL_CONTROLLERAXISMOTION
        if (event.type == SDL_CONTROLLERBUTTONDOWN) {
            int controller_idx = event.cbutton.which;
            int button_code = event.cbutton.button;
            
            // Translate values under piracy metaphor
            const char* translation = "button_down";
            event_callback(controller_idx, translation, button_code, 1.0);
            
            std::cout << "[Voyager-Helm] EVENT: Helm [" << controller_idx << "] Anchor Cast (Button ID: " << button_code << ")" << std::endl;
        } 
        else if (event.type == SDL_CONTROLLERAXISMOTION) {
            int controller_idx = event.caxis.which;
            int axis_code = event.caxis.axis;
            double normalized_value = event.caxis.value / 32767.0; // Normalize from JS coordinates
            
            // Filters deadzone
            if (abs(normalized_value) > 0.15) {
                const char* translation = "axis_motion";
                event_callback(controller_idx, translation, axis_code, normalized_value);
                
                std::cout << "[Voyager-Helm] EVENT: Helm [" << controller_idx << "] Steer Adjusted (Axis ID: " << axis_code << " -> " << normalized_value << ")" << std::endl;
            }
        }
        else if (event.type == SDL_CONTROLLERDEVICEADDED) {
            std::cout << "[Voyager-Helm] Connection Alert: New vessel spotted in port index " << event.cdevice.which << std::endl;
            scan_tethered_helms();
        }
        else if (event.type == SDL_CONTROLLERDEVICEREMOVED) {
            std::cout << "[Voyager-Helm] Connection Alert: Vessel pulled anchor from system." << std::endl;
            scan_tethered_helms();
        }
    }
}

/**
 * Release resources upon system teardown.
 */
extern "C" void close_helm_engine() {
    std::cout << "[Voyager-Helm] Releasing SDL controller memory..." << std::endl;
    for (auto* controller : g_helm_state.active_helms) {
        if (controller) {
            SDL_GameControllerClose(controller);
        }
    }
    g_helm_state.active_helms.clear();
    if (g_helm_state.is_initialized) {
        SDL_Quit();
        g_helm_state.is_initialized = false;
    }
}
