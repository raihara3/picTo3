import { create } from "zustand";

/** The decoded source image plus derived mesh stats. */
export interface ImageSource {
  readonly image: HTMLImageElement;
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  readonly name: string;
}

export interface MeshStats {
  readonly vertexCount: number;
  readonly triangleCount: number;
}

interface ImageState {
  source: ImageSource | null;
  stats: MeshStats | null;
  /** Store a freshly uploaded image (replaces any previous one). */
  loadImage: (source: ImageSource) => void;
  /** Record the latest generated-mesh statistics. */
  setStats: (stats: MeshStats | null) => void;
  /** Back to the empty state. */
  clearImage: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  source: null,
  stats: null,
  loadImage: (source) => set({ source, stats: null }),
  setStats: (stats) => set({ stats }),
  clearImage: () => set({ source: null, stats: null }),
}));
