import ReactGA from 'react-ga4';

const measurementId = 'G-2WN4J8KR01';
let analyticsInitialized = false;

const isDebugMode =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

type EventParams = Record<string, string | number | boolean | undefined>;

const isAnalyticsEnabled = () => Boolean(measurementId);

const removeUndefinedParams = (params: EventParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

export const initializeAnalytics = () => {
  if (!isAnalyticsEnabled() || analyticsInitialized) {
    return;
  }

  ReactGA.initialize(measurementId, {
    gtagOptions: isDebugMode ? { debug_mode: true } : undefined,
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

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title ?? document.title,
  });

  if (isDebugMode) {
    console.info('[analytics] page_view', path);
  }
};

export const trackEvent = (eventName: string, params: EventParams = {}) => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ReactGA.event(eventName, removeUndefinedParams(params));

  if (isDebugMode) {
    console.info('[analytics] event', eventName, params);
  }
};
