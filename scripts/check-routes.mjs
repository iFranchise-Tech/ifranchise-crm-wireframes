import assert from 'node:assert/strict';
import { authScreens } from '../modules/screen-library/config/auth-screens.ts';
import { crmModules } from '../modules/screen-library/config/modules.ts';

const origin = process.env.PREVIEW_ORIGIN ?? 'http://127.0.0.1:4173';
assert.equal(new Set(authScreens.map(screen => screen.id)).size, authScreens.length, 'Screen IDs must be unique');
assert.equal(new Set(authScreens.map(screen => screen.href)).size, authScreens.length, 'Direct screen routes must be unique');
const routes = [
  ...authScreens.map(screen => ({ path: screen.href, marker: 'review-shell', destination: `/library/authentication/${screen.id}` })),
  ...authScreens.map(screen => ({ path: `/library/authentication/${screen.id}`, marker: 'review-shell' })),
  ...authScreens.map(screen => ({ path: `/auth-preview/${screen.id}`, marker: 'auth-content' })),
  { path: '/demo/workspace', marker: 'workspace-home' },
  ...crmModules.map(module => ({ path: `/library/modules/${module.id}`, marker: 'review-shell' })),
  ...crmModules.map(module => ({ path: `/library/modules/${module.id}?view=overview`, marker: 'module-metrics' })),
  { path: '/library', marker: 'module-grid' },
  { path: '/library/authentication', marker: 'review-shell' },
  { path: '/library/authentication/overview', marker: 'module-metrics' },
];
let checked = 0;
for (let offset = 0; offset < routes.length; offset += 4) {
  await Promise.all(routes.slice(offset, offset + 4).map(async ({ path, marker, destination }) => {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, `${path} must be accessible`);
    const html = await response.text();
    assert.ok(html.includes(marker), `${path} must render its expected layout`);
    if (destination) assert.equal(new URL(response.url).pathname, destination, `${path} must open the shared review workspace`);
    if (marker === 'auth-content') assert.ok(!html.includes('class="review-shell"'), `${path} must not include review navigation`);
    if (path === '/demo/workspace') assert.ok(html.includes('class="review-sidebar"'), 'The post-sign-in workspace must retain screen navigation');
    checked++;
  }));
}
for (const state of ['not-a-real-state', 'constructor', 'toString']) {
  const missing = await fetch(`${origin}/status/${state}`);
  assert.equal(missing.status, 404, `Unknown state ${state} must return 404`);
}
for (const [legacy, current] of Object.entries({
  'email-validation': 'sign-in', 'password-validation': 'password',
  'password-visibility': 'password', 'reset-validation': 'reset-password',
  'setup-success': 'authenticated', 'workspace': 'authenticated', 'invitation-review': 'invitation', 'verify-success': 'authenticated',
})) {
  const response = await fetch(`${origin}/library/authentication/${legacy}?mode=mobile`);
  assert.equal(response.status, 200);
  assert.equal(new URL(response.url).pathname, `/library/authentication/${current}`);
  assert.equal(new URL(response.url).searchParams.get('mode'), 'mobile');
}
for (const prefix of ['/auth-preview', '/library/authentication']) {
  const response = await fetch(`${origin}${prefix}/constructor`);
  assert.equal(response.status, 404, 'Unknown review screens must return 404');
}
for (const [legacy, current] of [
  ['/sign-in/email-validation', '/library/authentication/sign-in'],
  ['/sign-in/password-validation', '/library/authentication/password'],
  ['/sign-in/password-visibility', '/library/authentication/password'],
  ['/reset-password/validation', '/library/authentication/reset-password'],
  ['/invitation/review', '/library/authentication/invitation'],
  ['/invitation/success', '/demo/workspace'],
  ['/verify/success', '/library/authentication/authenticated'],
  ['/auth-preview/verify-success', '/auth-preview/authenticated'],
]) {
  const response = await fetch(`${origin}${legacy}`);
  assert.equal(response.status, 200);
  assert.equal(new URL(response.url).pathname, current);
}
const mobileEntry = await fetch(`${origin}/sign-in?mode=mobile`, { redirect: 'manual' });
assert.equal(mobileEntry.status, 307, 'Direct entry uses a temporary review redirect');
const mobileDestination = new URL(mobileEntry.headers.get('location'), origin);
assert.equal(mobileDestination.pathname, '/library/authentication/sign-in');
assert.equal(mobileDestination.searchParams.get('mode'), 'mobile', 'Direct entry preserves the requested preview mode');
console.log(`Passed: ${checked} routes, ${authScreens.length} authentication screens with shared navigation, isolated embeds, legacy links, and unknown-state handling.`);
