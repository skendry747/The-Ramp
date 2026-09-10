export const GA_MEASUREMENT_ID = "G-ET13MCSMJC";

type AnalyticsEventParameters = Record<string, string | number | boolean>;

export function trackGoogleAnalyticsEvent(eventName: string, parameters?: AnalyticsEventParameters) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  try {
    window.gtag("event", eventName, parameters);
  } catch {
    // Analytics must never interrupt the user-facing action being measured.
  }
}
