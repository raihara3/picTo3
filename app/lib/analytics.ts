import { sendGAEvent } from "@next/third-parties/google";

/**
 * GA4 custom events (client-side only). Visit counts come from the automatic
 * `page_view` event wired via the root `<GoogleAnalyticsTag>`; these are the
 * interaction events. Params are anonymous — never the image bytes, content, or
 * filename. No-op unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
 */
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Params = Record<string, string | number | boolean>;

function track(event: string, params?: Params): void {
  if (!MEASUREMENT_ID || typeof window === "undefined") {
    return;
  }
  sendGAEvent("event", event, params ?? {});
}

/** Params for `model_export`, captured at save time. */
export interface ModelExportParams {
  /** Side-wall colouring chosen for the export. */
  side_color: "edge" | "custom";
  /** Whether any animation was baked into the glb. */
  has_animation: boolean;
  /** Size of the exported glb, in KiB. */
  file_size_kb: number;
}

export const analytics = {
  /** An image was uploaded and successfully decoded. */
  imageUpload: () => track("image_upload"),
  /** A glb was exported (downloaded). */
  modelExport: (params: ModelExportParams) => track("model_export", { ...params }),
};
