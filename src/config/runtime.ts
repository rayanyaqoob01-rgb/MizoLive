import { Capacitor } from '@capacitor/core';

export const DEFAULT_PRODUCTION_API_URL =
  'https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app';

export function resolveApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) {
    return configured;
  }

  if (Capacitor.isNativePlatform()) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (
      protocol === 'capacitor:' ||
      protocol === 'file:' ||
      hostname.endsWith('.web.app') ||
      hostname.endsWith('.firebaseapp.com')
    ) {
      return DEFAULT_PRODUCTION_API_URL;
    }
  }

  return '';
}

export function resolveApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const base = resolveApiBaseUrl();
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${normalized}` : normalized;
}

export function resolveWsUrl(): string {
  const base = resolveApiBaseUrl();
  if (base) {
    const parsed = new URL(base);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}/ws`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}
