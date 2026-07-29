import { create } from "zustand";
import type { AnimationId } from "../pipeline/animations";

interface AnimationState {
  /** Animations selected to bake into the exported glb. */
  exportIds: AnimationId[];
  /** Animation currently previewing in the viewer (one at a time), or none. */
  previewId: AnimationId | null;
  toggleExport: (id: AnimationId) => void;
  setPreview: (id: AnimationId | null) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
  exportIds: [],
  previewId: null,
  toggleExport: (id) =>
    set((state) => ({
      exportIds: state.exportIds.includes(id)
        ? state.exportIds.filter((entry) => entry !== id)
        : [...state.exportIds, id],
    })),
  setPreview: (previewId) => set({ previewId }),
}));
