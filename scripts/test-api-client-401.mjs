import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/services/apiClient.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
process.env.EXPO_PUBLIC_API_URL = 'http://meshpay.test';
const { apiClient } = await import(moduleUrl);
let sessionEnded = 0;
apiClient.setAccessToken('test-session-token');
apiClient.setUnauthorizedHandler(() => { sessionEnded += 1; });

globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Current password is incorrect.' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' },
});
await assert.rejects(apiClient.post('/api/password/change', {}), { status: 401 });
assert.equal(sessionEnded, 0, 'wrong password must not end the session');

globalThis.fetch = async () => new Response(JSON.stringify({ code: 'AUTHENTICATION_REQUIRED', message: 'Sign in again.' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' },
});
await assert.rejects(apiClient.get('/api/transactions'), { status: 401 });
assert.equal(sessionEnded, 1, 'expired session must invoke the session-ended handler');
console.log('apiClient 401 behavior: passed');
