"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    __theRampGoogleAnalyticsInitialized?: boolean;
  }
}

function initializeGoogleAnalytics(): Gtag {
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

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const queryString = searchParams.toString();
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname;

    if (lastTrackedPath.current === pagePath) return;

    const gtag = initializeGoogleAnalytics();
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
    });
    lastTrackedPath.current = pagePath;
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  return (
    <>
      <Script
        id="the-ramp-google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
