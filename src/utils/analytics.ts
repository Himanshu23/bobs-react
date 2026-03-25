declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = 'G-2WN4J8KR01';
let analyticsInitialized = false;

const isDebugMode =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

type EventParams = Record<string, string | number | boolean | undefined>;

const isAnalyticsEnabled = () => Boolean(measurementId);

const ensureGtagQueue = () => {
  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);

      if (isDebugMode) {
        console.info('[analytics] gtag push', args);
      }
    };
  }
};

export const initializeAnalytics = () => {
  if (!isAnalyticsEnabled() || analyticsInitialized) {
    return;
  }

  ensureGtagQueue();

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-ga-measurement-id="${measurementId}"]`
  );

  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.gaMeasurementId = measurementId;

    if (isDebugMode) {
      script.onload = () => {
        console.info('[analytics] gtag script loaded', {
          measurementId,
          src: script.src,
        });
      };

      script.onerror = () => {
        console.error('[analytics] gtag script failed to load', {
          measurementId,
          src: script.src,
        });
      };
    }

    document.head.appendChild(script);
  }

  window.gtag?.('js', new Date());
  window.gtag?.('config', measurementId, {
    debug_mode: isDebugMode,
  });

  analyticsInitialized = true;

  if (isDebugMode) {
    console.info('[analytics] initialized', { measurementId });
  }
};

export const trackPageView = (path: string, title?: string) => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureGtagQueue();

  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: `${window.location.origin}${path}`,
    debug_mode: isDebugMode,
  });

  if (isDebugMode) {
    console.info('[analytics] page_view', path);
  }
};

export const trackEvent = (eventName: string, params: EventParams = {}) => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureGtagQueue();

  window.gtag?.('event', eventName, {
    ...params,
    debug_mode: isDebugMode,
  });

  if (isDebugMode) {
    console.info('[analytics] event', eventName, params);
  }
};
