declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID ?? 'G-2WN4J8KR01';

let analyticsInitialized = false;

type EventParams = Record<string, string | number | boolean | undefined>;

const isAnalyticsEnabled = () => Boolean(measurementId);

export const initializeAnalytics = () => {
  if (!isAnalyticsEnabled() || analyticsInitialized) {
    return;
  }

  const scriptTag = document.createElement('script');
  scriptTag.async = true;
  scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(scriptTag);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
  });

  analyticsInitialized = true;
};

export const trackPageView = (path: string, title?: string) => {
  if (!isAnalyticsEnabled() || !window.gtag || !measurementId) {
    return;
  }

  window.gtag('config', measurementId, {
    page_path: path,
    page_title: title ?? document.title,
  });
};

export const trackEvent = (eventName: string, params: EventParams = {}) => {
  if (!isAnalyticsEnabled() || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
};
