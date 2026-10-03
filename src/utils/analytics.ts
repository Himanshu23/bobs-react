import ReactGA from 'react-ga4';
import { Capacitor } from '@capacitor/core';
import { resolveAnalyticsConfig } from './analyticsConfig';
import { AnalyticsParams, removeUndefinedParams } from './analyticsItems';

export type { AnalyticsItem, AnalyticsParams } from './analyticsItems';

// See docs/ANALYTICS.md (repo root) for the events and GA setup.
const config = resolveAnalyticsConfig({
  envMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  isProductionBuild: import.meta.env.PROD,
  hostname: typeof window !== 'undefined' ? window.location.hostname : '',
  isNativeApp: Capacitor.isNativePlatform(),
});

// Console logging of every hit on dev builds (also when GA is disabled) and
// whenever GA runs in debug mode.
const shouldLog = import.meta.env.DEV || config.debugMode;

let analyticsInitialized = false;

const log = (...args: unknown[]) => {
  if (shouldLog) {
    console.info('[analytics]', ...args);
  }
};

export const initializeAnalytics = () => {
  if (analyticsInitialized) {
    return;
  }
  analyticsInitialized = true;

  if (!config.enabled || !config.measurementId) {
    log('disabled (set VITE_GA_MEASUREMENT_ID to send from this build)');
    return;
  }

  ReactGA.initialize(config.measurementId, {
    gtagOptions: {
      // Page views are sent manually per route (App.tsx, RestaurantMenuPage).
      send_page_view: false,
      ...(config.debugMode ? { debug_mode: true } : {}),
    },
  });

  log('initialized', {
    measurementId: config.measurementId,
    debugMode: config.debugMode,
  });
};

/**
 * One page_view. `title` defaults to `document.title`; `params` adds event
 * params such as `restaurant_id` / `restaurant_name`.
 */
export const trackPageView = (
  path: string,
  title?: string,
  params: AnalyticsParams = {}
) => {
  const pageTitle =
    title ?? (typeof document !== 'undefined' ? document.title : undefined);
  log('page_view', path, pageTitle, params);

  if (!config.enabled) {
    return;
  }

  // Child effects run before the layout's: make sure `config` comes first.
  initializeAnalytics();
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: pageTitle,
    ...removeUndefinedParams(params),
  });
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  log('event', eventName, params);

  if (!config.enabled) {
    return;
  }

  initializeAnalytics();
  ReactGA.event(eventName, removeUndefinedParams(params));
};
