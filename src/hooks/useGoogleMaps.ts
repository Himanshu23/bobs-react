import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: typeof google;
    __bobMapsPromise?: Promise<typeof google>;
  }
}

const MAPS_SCRIPT_ID = 'bob-google-maps-script';

export function getGoogleMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
}

function loadGoogleMapsScript(apiKey: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window unavailable'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (window.__bobMapsPromise) {
    return window.__bobMapsPromise;
  }

  window.__bobMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID);

    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google);
        } else {
          reject(new Error('Google Maps failed to load'));
        }
      });
      existing.addEventListener('error', () =>
        reject(new Error('Google Maps script error'))
      );
      return;
    }

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps unavailable after load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return window.__bobMapsPromise;
}

export function useGoogleMaps() {
  const apiKey = getGoogleMapsApiKey();
  const [maps, setMaps] = useState<typeof google | null>(
    typeof window !== 'undefined' && window.google?.maps ? window.google : null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(apiKey) && !maps);

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      setError('Missing VITE_GOOGLE_MAPS_API_KEY');
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadGoogleMapsScript(apiKey)
      .then((googleMaps) => {
        if (!cancelled) {
          setMaps(googleMaps);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return {
    apiKey,
    maps,
    loading,
    error,
    isReady: Boolean(maps?.maps),
  };
}
