import assert from 'node:assert/strict';
import { authScreens } from '../modules/screen-library/config/auth-screens.ts';
import { crmModules } from '../modules/screen-library/config/modules.ts';

const origin = process.env.PREVIEW_ORIGIN ?? 'http://127.0.0.1:4173';
assert.equal(new Set(authScreens.map(screen => screen.id)).size, authScreens.length, 'Screen IDs must be unique');
assert.equal(new Set(authScreens.map(screen => screen.href)).size, authScreens.length, 'Direct screen routes must be unique');
const routes = [
  ...authScreens.map(screen => ({ path: screen.href, marker: 'auth-content' })),
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
  await Promise.all(routes.slice(offset, offset + 4).map(async ({ path, marker }) => {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, `${path} must be accessible`);
    const html = await response.text();
    assert.ok(html.includes(marker), `${path} must render its expected layout`);
    if (marker === 'auth-content') assert.ok(!html.includes('class="review-shell"'), `${path} must not include review navigation`);
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
for (const [legacy, current] of [['/verify/success', '/demo/authenticated'], ['/auth-preview/verify-success', '/auth-preview/authenticated']]) {
  const response = await fetch(`${origin}${legacy}`);
  assert.equal(response.status, 200);
  assert.equal(new URL(response.url).pathname, current);
}
console.log(`Passed: ${checked} routes, ${authScreens.length} clean authentication screens, unique IDs, and unknown-state handling.`);
