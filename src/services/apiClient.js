const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
let accessToken = null;
let unauthorizedHandler = null;
let appLockRequiredHandler = null;

export class ApiClientError extends Error {
  constructor(message, { status=null, networkFailure=false, timedOut=false }={}) {
    super(message);
    this.name='ApiClientError';
    this.status=status;
    this.networkFailure=networkFailure;
    this.timedOut=timedOut;
  }
}

async function request(path, { method='GET', body, timeoutMs=9000 } = {}) {
  if (!baseUrl) throw new ApiClientError('Backend URL is not configured.', { networkFailure:true });
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      signal:controller.signal,
      headers: {
        Accept:'application/json',
        ...(body === undefined ? {} : { 'Content-Type':'application/json' }),
        ...(accessToken ? { Authorization:`Bearer ${accessToken}` } : {}),
      },
      ...(body === undefined ? {} : { body:JSON.stringify(body) }),
    });
  } catch {
    if (timedOut) {
      throw new ApiClientError('The server took too long to respond. The request may still have completed, so check the latest status before retrying.', { networkFailure:true, timedOut:true });
    }
    throw new ApiClientError('Cannot reach the backend.', { networkFailure:true });
  } finally {
    clearTimeout(timeout);
  }

  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = { message:raw }; }
  }
  if (!response.ok) {
    if (response.status === 423 && data?.code === 'APP_LOCK_REQUIRED' && appLockRequiredHandler) {
      try { appLockRequiredHandler(); } catch {}
    }
    // Only the authentication entry point's code denotes an expired/revoked session.
    // Protected endpoints also use 401 for bad passwords and OTPs.
    if (response.status === 401 && data?.code === 'AUTHENTICATION_REQUIRED' && accessToken && !path.startsWith('/api/auth/') && unauthorizedHandler) {
      try { unauthorizedHandler(); } catch {}
    }
    throw new ApiClientError(data?.message || data?.error || `Request failed (${response.status}).`, { status:response.status });
  }
  return data;
}

export const apiClient = {
  baseUrl,
  get isConfigured() { return Boolean(baseUrl); },
  get hasAccessToken() { return Boolean(accessToken); },
  setAccessToken(token) { accessToken = token || null; },
  setUnauthorizedHandler(handler) { unauthorizedHandler = typeof handler === 'function' ? handler : null; },
  setAppLockRequiredHandler(handler) { appLockRequiredHandler = typeof handler === 'function' ? handler : null; },
  get(path, options) { return request(path, options); },
  post(path, body, options) { return request(path, { method:'POST', body, ...options }); },
  put(path, body, options) { return request(path, { method:'PUT', body, ...options }); },
  delete(path, options) { return request(path, { method:'DELETE', ...options }); },
};
