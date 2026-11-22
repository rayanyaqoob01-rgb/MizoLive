import { resolveApiUrl } from '../config/runtime';

export interface ApiDiagnosticEntry {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  ok: boolean;
  message: string;
  timestamp: string;
  durationMs: number;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  code?: string;
}

class CentralizedApiClient {
  private lastSuccess: ApiDiagnosticEntry | null = null;
  private recentErrors: ApiDiagnosticEntry[] = [];
  private recentRequests: ApiDiagnosticEntry[] = [];
  private authHeadersProvider: (() => Record<string, string>) | null = null;

  setAuthHeadersProvider(provider: () => Record<string, string>) {
    this.authHeadersProvider = provider;
  }

  getDiagnostics() {
    return {
      lastSuccess: this.lastSuccess,
      recentErrors: [...this.recentErrors],
      recentRequests: [...this.recentRequests],
      backendReachable: this.lastSuccess !== null,
    };
  }

  recordExternalError(source: string, message: string, status = 500) {
    const entry: ApiDiagnosticEntry = {
      id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      endpoint: source,
      method: 'CLIENT',
      status,
      ok: false,
      message,
      timestamp: new Date().toISOString(),
      durationMs: 0,
    };
    this.recentErrors = [entry, ...this.recentErrors].slice(0, 25);
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      headers?: Record<string, string>;
      timeoutMs?: number;
    } = {}
  ): Promise<ApiResult<T>> {
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs ?? 12000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = performance.now();

    try {
      const providedHeaders = this.authHeadersProvider ? this.authHeadersProvider() : {};
      const res = await fetch(resolveApiUrl(endpoint), {
        method,
        signal: controller.signal,
        headers: {
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...providedHeaders,
          ...(options.headers || {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const durationMs = Math.round(performance.now() - startedAt);
      let parsed: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          parsed = await res.json();
        } catch {
          parsed = null;
        }
      }

      if (!res.ok) {
        let fallbackMessage = `Request failed with status ${res.status}`;
        if (res.status === 401) fallbackMessage = 'Session unauthorized — please sign in again.';
        else if (res.status === 403) fallbackMessage = 'Access denied — insufficient permissions.';
        else if (res.status === 408 || res.status === 504) fallbackMessage = 'Server request timed out.';
        else if (res.status >= 500) fallbackMessage = 'Server error occurred — please retry.';

        const errMessage =
          (parsed && (parsed.error || parsed.message)) || fallbackMessage;
        const entry: ApiDiagnosticEntry = {
          id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          endpoint,
          method,
          status: res.status,
          ok: false,
          message: errMessage,
          timestamp: new Date().toISOString(),
          durationMs,
        };
        this.recentErrors = [entry, ...this.recentErrors].slice(0, 25);
        this.recentRequests = [entry, ...this.recentRequests].slice(0, 20);

        return {
          ok: false,
          status: res.status,
          data: parsed,
          error: errMessage,
          code: parsed?.code,
        };
      }

      const okEntry: ApiDiagnosticEntry = {
        id: `ok-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        endpoint,
        method,
        status: res.status,
        ok: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
        durationMs,
      };
      this.lastSuccess = okEntry;
      this.recentRequests = [okEntry, ...this.recentRequests].slice(0, 20);

      return {
        ok: true,
        status: res.status,
        data: parsed as T,
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startedAt);
      const isTimeout = err?.name === 'AbortError';
      const msg = isTimeout
        ? `Request to ${endpoint} timed out after ${timeoutMs}ms`
        : err?.message || 'Network unavailable — check your internet connection';

      const entry: ApiDiagnosticEntry = {
        id: `net-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        endpoint,
        method,
        status: isTimeout ? 408 : 0,
        ok: false,
        message: msg,
        timestamp: new Date().toISOString(),
        durationMs,
      };
      this.recentErrors = [entry, ...this.recentErrors].slice(0, 25);
      this.recentRequests = [entry, ...this.recentRequests].slice(0, 20);

      return {
        ok: false,
        status: isTimeout ? 408 : 0,
        data: null,
        error: msg,
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }
}

export const apiClient = new CentralizedApiClient();
