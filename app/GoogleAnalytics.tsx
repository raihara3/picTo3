import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * GA4 tag. Renders nothing (and loads no script) unless
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, so local/test builds stay silent. The
 * tag fires the automatic `page_view`; custom interaction events are sent from
 * `lib/analytics.ts`.
 */
export function GoogleAnalyticsTag() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return null;
  }
  return <GoogleAnalytics gaId={measurementId} />;
}
