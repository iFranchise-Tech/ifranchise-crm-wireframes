/** One WebGL draw: spherical surface, separate clouds, atmosphere and stars.
 * No scene graph, animation dependency, React frame updates or moving DOM.
 * Texture attribution: public/images/earth/ATTRIBUTION.md.
 */
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time;
uniform sampler2D surfaceMap;
uniform sampler2D lightMap;
uniform sampler2D cloudMap;
const float PI = 3.14159265359;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float stars(vec2 p, float scale, float speed) {
  vec2 grid = p * scale + vec2(time * speed, time * speed * .18);
  vec2 cell = floor(grid);
  float seed = hash(cell);
  vec2 point = vec2(hash(cell + 8.3), hash(cell + 17.2)) * .8 + .1;
  float d = length(fract(grid) - point);
  float twinkle = .85 + .15 * sin(time * (.22 + seed * .2) + seed * 61.);
  float size = mix(.018, .042, seed);
  float core = 1. - smoothstep(0., size, d);
  float halo = exp(-d * 65.) * .16;
  return (core + halo) * step(.94, seed) * twinkle;
}
vec2 mapPoint(vec3 n, float rotation) {
  // A tilted orbit across the northern hemisphere, independent of axial rotation.
  float a = .62;
  vec3 p = vec3(n.x, n.y * cos(a) - n.z * sin(a), n.y * sin(a) + n.z * cos(a));
  return vec2(fract(atan(p.z, p.x) / (2. * PI) + .5 + rotation), .5 - asin(clamp(p.y, -1., 1.)) / PI);
}
vec3 displayColor(vec3 c) {
  // A gentle photographic shoulder preserves warm highlights and deep blue shadows.
  c = max(c, vec3(0.));
  return pow(c / (1. + c * .55), vec3(1. / 2.2));
}
void main() {
  float aspect = resolution.x / resolution.y;
  vec2 screen = vec2((uv.x - .5) * aspect, uv.y);
  vec3 sky = mix(vec3(.00012, .00055, .002), vec3(.00035, .0018, .007), 1. - uv.y);
  float nebula = exp(-length((screen - vec2(aspect * .36, .68)) * vec2(1.1, 2.)) * 5.);
  sky += vec3(.0004, .0017, .0045) * nebula;
  sky += vec3(.13, .23, .39) * stars(screen, 57., .003) * .8;
  sky += vec3(.4, .49, .61) * stars(screen, 29., .0045) * .7;
  sky += vec3(.04, .075, .12) * stars(screen, 96., .0012) * .3;

  // Fixed orbital framing. Only the mapped longitude rotates, never the UI or silhouette.
  float radius = max(2.4, aspect * 1.26);
  float horizon = .55;
  vec2 p = vec2(screen.x, uv.y + radius - horizon + screen.x * .026);
  float limb = length(p) - radius;
  float rotation = -.08 + time / 1200.;
  float sunX = aspect * (.355 + .035 * sin(time * .008));
  float sunY = sqrt(max(0., radius * radius - sunX * sunX)) - radius + horizon - sunX * .026;
  vec2 sunPoint = vec2(sunX, sunY + .009);
  vec2 sunOffset = screen - sunPoint;
  float sunDistance = length(sunOffset);
  vec3 sunlight = normalize(vec3(.72, .17, -.62));
  vec3 color = sky;

  if (limb < 0.) {
    vec3 normal = vec3(p, sqrt(max(0., radius * radius - dot(p, p)))) / radius;
    vec2 earthUV = mapPoint(normal, rotation);
    vec3 ground = pow(texture2D(surfaceMap, earthUV).rgb, vec3(2.2));
    float illumination = dot(normal, sunlight);
    float day = smoothstep(-.13, .26, illumination);
    float direct = max(illumination, 0.);
    // Blue ambient illumination keeps geography visible on the night side.
    color = ground * (vec3(.008, .025, .085) + vec3(.72, .86, 1.08) * direct * 1.65);
    color += vec3(.0005, .0025, .011) * (1. - day);
    float ocean = smoothstep(.01, .045, ground.b - ground.r) * (1. - smoothstep(.15, .35, ground.g));
    vec3 halfVector = normalize(sunlight + vec3(0., 0., 1.));
    float reflection = pow(max(dot(normal, halfVector), 0.), 65.);
    color += vec3(.42, .57, .7) * reflection * ocean * day;

    float city = texture2D(lightMap, earthUV).r;
    float cityMask = smoothstep(.025, .3, city);
    color += vec3(1., .48, .13) * pow(city, 1.15) * cityMask * (1. - smoothstep(-.1, .26, illumination)) * 1.5;

    // Clouds occupy their own shell: separate drift, sun-facing edges and soft ground shadows.
    float cloudRadius = radius + .008;
    vec3 cloudNormal = vec3(p, sqrt(max(0., cloudRadius * cloudRadius - dot(p, p)))) / cloudRadius;
    vec2 cloudUV = mapPoint(cloudNormal, rotation + .003 + time / 4800.);
    float cloud = texture2D(cloudMap, cloudUV).r;
    float shadow = texture2D(cloudMap, cloudUV + vec2(.0012, .0007)).r;
    float edge = cloud - texture2D(cloudMap, cloudUV + vec2(.00045, -.0003)).r;
    float coverage = smoothstep(.08, .91, cloud);
    color *= 1. - shadow * .24 * day;
    vec3 cloudLight = vec3(.008, .032, .085) + vec3(.68, .82, 1.) * pow(max(direct, .0), .65) * 1.25;
    cloudLight *= 1. + clamp(edge * 3., -.24, .24);
    color = mix(color, cloudLight, coverage * .94);

    // Optical depth increases toward the limb; no opaque neon ring.
    float air = pow(1. - normal.z, 5.5);
    vec3 atmosphere = vec3(.008, .16, .62) * (.6 + day * .4);
    color = mix(color, atmosphere, air * .65);
    color += vec3(.07, .34, .7) * exp(limb * 320.) * .5;
  } else {
    // A very thin bright atmosphere with a broad, faint scattering falloff.
    float thinAir = exp(-limb * 260.);
    float scatteredAir = exp(-limb * 65.);
    float outerAir = exp(-limb * 21.);
    color += vec3(.12, .47, .9) * thinAir * .65;
    color += vec3(.004, .072, .28) * scatteredAir;
    color += vec3(.0005, .008, .038) * outerAir;
  }

  // Warm sunlight blooms just above the horizon, drifting along the orbital arc.
  float visibility = smoothstep(-.025, .006, limb);
  color += vec3(.085, .047, .032) * exp(-sunDistance * 13.) * visibility;
  color += vec3(.95, .36, .10) * exp(-sunDistance * 39.) * visibility;
  color += vec3(4., 3.3, 2.4) * exp(-sunDistance * 145.) * visibility;
  float streak = exp(-abs(sunOffset.y) * 170.) * exp(-abs(sunOffset.x) * 12.);
  color += vec3(.11, .12, .13) * streak * visibility;
  color *= 1. - .22 * smoothstep(.3, .95, length(vec2((uv.x - .5) * 1.1, uv.y - .48)));
  gl_FragColor = vec4(displayColor(color), 1.);
}
`;

export function createEarthRenderer(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return () => {};
  let disposed = false, ready = false, visible = true;
  let frame = 0, elapsed = 0, previous = 0, lastDraw = 0;
  const textures: WebGLTexture[] = [];
  const shaders: WebGLShader[] = [];
  const images: HTMLImageElement[] = [];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const desktop = canvas.clientWidth > 600;
  const textureExtension = desktop && maxTextureSize >= 4096 ? "webp" : "jpg";
  const detailedMaps = desktop && maxTextureSize >= 8192;
  const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!program || !buffer) return () => { gl.deleteProgram(program); gl.deleteBuffer(buffer); };
  const cleanup = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    images.forEach((image) => { image.onload = null; image.onerror = null; });
    textures.forEach((texture) => gl.deleteTexture(texture));
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer); gl.deleteProgram(program);
    delete canvas.dataset.ready;
  };
  for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
    const shader = gl.createShader(type);
    if (!shader) { cleanup(); return () => {}; }
    shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { cleanup(); return () => {}; }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { cleanup(); return () => {}; }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "resolution");
  const time = gl.getUniformLocation(program, "time");
  function draw() {
    if (!ready || disposed || gl!.isContextLost()) return;
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(resolution, canvas.width, canvas.height); gl!.uniform1f(time, elapsed);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt((desktop ? 2_000_000 : 800_000) / Math.max(1, width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
    draw();
  }
  function tick(now: number) {
    if (disposed || !ready || motion.matches || document.hidden || !visible) { frame = 0; previous = 0; return; }
    if (previous) elapsed += Math.min((now - previous) / 1000, .1);
    previous = now;
    if (now - lastDraw >= 1000 / 30) { draw(); lastDraw = now; }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    if (motion.matches) { draw(); return; }
    if (ready && visible && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
  }
  const resizer = new ResizeObserver(resize);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
  resizer.observe(canvas); observer.observe(canvas);
  motion.addEventListener("change", resume); document.addEventListener("visibilitychange", resume);
  const lost = (event: Event) => { event.preventDefault(); ready = false; cancelAnimationFrame(frame); delete canvas.dataset.ready; };
  canvas.addEventListener("webglcontextlost", lost);
  Promise.all(["day", "night", "clouds"].map((name, index) => new Promise<void>((resolve, reject) => {
    const image = new Image(); images.push(image);
    image.onload = () => {
      if (disposed) return;
      const texture = gl.createTexture();
      if (!texture) { reject(); return; }
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, texture);
      // Single-channel cloud/light maps reduce GPU memory without sacrificing detail.
      const format = index === 0 ? gl.RGB : gl.LUMINANCE;
      gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(program, ["surfaceMap", "lightMap", "cloudMap"][index]), index);
      resolve();
    };
    image.onerror = reject;
    image.src = detailedMaps && index > 0 ? `/images/earth/${name}-detail.webp` : `/images/earth/${name}.${textureExtension}`;
  }))).then(() => {
    if (disposed) return;
    ready = true; resize(); canvas.dataset.ready = "true"; resume();
  }).catch(() => { /* Keep the initial still image if a texture fails. */ });
  return () => {
    resizer.disconnect(); observer.disconnect();
    motion.removeEventListener("change", resume); document.removeEventListener("visibilitychange", resume);
    canvas.removeEventListener("webglcontextlost", lost); cleanup();
  };
}
