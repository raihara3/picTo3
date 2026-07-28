import { create } from "zustand";

/** Generation controls (0–100 slider units), shared by the sidebar + pipeline. */
interface SettingsState {
  smoothness: number;
  thickness: number;
  setSmoothness: (smoothness: number) => void;
  setThickness: (thickness: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  smoothness: 40,
  thickness: 30,
  setSmoothness: (smoothness) => set({ smoothness }),
  setThickness: (thickness) => set({ thickness }),
}));
