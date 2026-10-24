/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_BASE_SOCKET_URL?: string;
  /** GA4 measurement id; see utils/analyticsConfig.ts. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** 'true' turns on the WhatsApp login code before a customer's first order. */
  readonly VITE_WHATSAPP_LOGIN_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
