import test from "node:test";
import assert from "node:assert/strict";
import { createEarthRenderer } from "../lib/visual/earth-renderer.ts";

function environment(t, { reducedMotion = false, supported = true } = {}) {
  const images = [], draws = [], frames = new Map(), listeners = new Map();
  let sequence = 0, contextLost = false, time = 0, onIntersection;
  const gl = new Proxy({
    getParameter: () => 8192,
    getExtension: () => null,
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    getUniformLocation: (_, name) => name,
    isContextLost: () => contextLost,
    uniform1f: (_, value) => { time = value; },
    drawArrays: () => { draws.push(time); },
  }, { get(target, key) {
    if (key in target) return target[key];
    if (/^[A-Z_0-9]+$/.test(key)) return key;
    if (key.startsWith("create")) return () => ({});
    return () => {};
  } });
  const canvas = {
    dataset: {}, clientWidth: 1000, width: 300, height: 150,
    getContext: () => supported ? gl : null,
    getBoundingClientRect: () => ({ width: 1000, height: 625 }),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const globals = {
    window: { devicePixelRatio: 1, matchMedia: () => ({ matches: reducedMotion, addEventListener() {}, removeEventListener() {} }) },
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    Image: class { constructor() { images.push(this); } },
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class { constructor(callback) { onIntersection = callback; } observe() {} disconnect() {} },
    requestAnimationFrame: (callback) => { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const restore = [];
  let release;
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    restore.push(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
  t.after(() => { release?.(); restore.forEach((restoreGlobal) => restoreGlobal()); });
  return {
    canvas, images, draws, frames,
    start: () => {
      const cleanup = createEarthRenderer(canvas);
      release = () => { cleanup(); release = undefined; };
      return () => release?.();
    },
    intersect: () => onIntersection([{ isIntersecting: true }]),
    loseContext: () => { contextLost = true; listeners.get("webglcontextlost")({ preventDefault() {} }); },
    flushFrame: (now = 100) => {
      const pending = [...frames.values()]; frames.clear();
      pending.forEach((callback) => callback(now));
    },
    settle: () => new Promise((resolve) => setImmediate(resolve)),
  };
}

test("keeps the poster until every texture loads and a complete initial frame is drawn", async (t) => {
  const env = environment(t);
  env.start();
  env.images[0].onload(); env.images[1].onload();
  await env.settle();
  assert.equal(env.canvas.dataset.ready, undefined);
  assert.equal(env.draws.length, 0);
  env.images[2].onload();
  await env.settle();
  env.intersect();
  assert.equal(env.canvas.dataset.ready, undefined);
  assert.equal(env.frames.size, 1, "intersection must not start animation before the reveal");
  env.flushFrame();
  assert.equal(env.canvas.dataset.ready, "true");
  assert.ok(env.draws.length > 0);
  assert.ok(env.draws.every((time) => time === 0), "the revealed frame must match the time-zero poster");
});

test("failed textures leave the poster visible", async (t) => {
  const env = environment(t);
  env.start();
  env.images[0].onload(); env.images[1].onerror(); env.images[2].onload();
  await env.settle();
  assert.equal(env.canvas.dataset.ready, undefined);
  assert.equal(env.draws.length, 0);
  assert.equal(env.frames.size, 0);
});

test("cleanup cancels an outstanding reveal and prevents late image callbacks", async (t) => {
  const env = environment(t);
  const release = env.start();
  env.images.forEach((image) => image.onload());
  await env.settle();
  assert.equal(env.frames.size, 1);
  release();
  env.flushFrame();
  assert.equal(env.canvas.dataset.ready, undefined);
  assert.equal(env.frames.size, 0);
  assert.ok(env.images.every((image) => image.onload === null && image.onerror === null));
});

test("context loss hides the canvas and cancels queued animation immediately", async (t) => {
  const env = environment(t);
  env.start();
  env.images.forEach((image) => image.onload());
  await env.settle(); env.flushFrame();
  assert.equal(env.canvas.dataset.ready, "true");
  env.loseContext();
  assert.equal(env.canvas.dataset.ready, undefined);
  assert.equal(env.frames.size, 0);
});

test("reduced motion presents the first frame without starting an animation loop", async (t) => {
  const env = environment(t, { reducedMotion: true });
  env.start();
  env.images.forEach((image) => image.onload());
  await env.settle(); env.flushFrame();
  assert.equal(env.canvas.dataset.ready, "true");
  assert.equal(env.frames.size, 0);
  assert.ok(env.draws.every((time) => time === 0));
});

test("unsupported WebGL leaves the static Earth available", (t) => {
  const env = environment(t, { supported: false });
  env.start()();
  assert.equal(env.canvas.dataset.ready, undefined);
  assert.equal(env.images.length, 0);
});
