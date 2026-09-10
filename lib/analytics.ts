export const GA_MEASUREMENT_ID = "G-ET13MCSMJC";

type AnalyticsEventParameters = Record<string, string | number | boolean>;
export type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    __theRampGoogleAnalyticsInitialized?: boolean;
  }
}

export function initializeGoogleAnalytics(): Gtag | null {
  if (typeof window === "undefined") return null;

  const dataLayer = (window.dataLayer = window.dataLayer ?? []);
  const gtag =
    window.gtag ??
    function gtag() {
      dataLayer.push(arguments);
    };

  window.gtag = gtag;

  if (!window.__theRampGoogleAnalyticsInitialized) {
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    window.__theRampGoogleAnalyticsInitialized = true;
  }

  return gtag;
}

export function trackGoogleAnalyticsEvent(eventName: string, parameters?: AnalyticsEventParameters) {
  if (typeof window === "undefined") return;

  try {
    initializeGoogleAnalytics()?.("event", eventName, parameters);
  } catch {
    // Analytics must never interrupt the user-facing action being measured.
  }
}
