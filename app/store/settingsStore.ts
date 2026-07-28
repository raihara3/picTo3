import { create } from "zustand";

/**
 * Side-wall colouring: `edge` samples the image's boundary colour onto the
 * extrusion walls; `custom` uses a single user-picked colour.
 */
export type SideColorMode = "edge" | "custom";

/** Default custom side colour (neutral, matches the light surface ramp). */
export const DEFAULT_SIDE_COLOR = "#c8c4bd";

/** Generation controls (0–100 slider units), shared by the sidebar + pipeline. */
interface SettingsState {
  smoothness: number;
  thickness: number;
  sideColorMode: SideColorMode;
  sideColor: string;
  setSmoothness: (smoothness: number) => void;
  setThickness: (thickness: number) => void;
  setSideColorMode: (mode: SideColorMode) => void;
  setSideColor: (color: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  smoothness: 40,
  thickness: 30,
  sideColorMode: "edge",
  sideColor: DEFAULT_SIDE_COLOR,
  setSmoothness: (smoothness) => set({ smoothness }),
  setThickness: (thickness) => set({ thickness }),
  setSideColorMode: (sideColorMode) => set({ sideColorMode }),
  setSideColor: (sideColor) => set({ sideColor }),
}));
