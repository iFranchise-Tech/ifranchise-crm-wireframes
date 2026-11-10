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
  vec2 grid = p * scale + vec2(time * speed, time * speed * .24);
  vec2 cell = floor(grid);
  float seed = hash(cell);
  vec2 point = vec2(hash(cell + 8.3), hash(cell + 17.2)) * .8 + .1;
  float d = length(fract(grid) - point);
  float twinkle = .78 + .22 * sin(time * (.35 + seed) + seed * 61.);
  return (1. - smoothstep(0., .045, d)) * step(.91, seed) * twinkle;
}
vec2 mapPoint(vec3 n, float rotation) {
  // Tilt the visible north limb toward the equatorial continents.
  float a = .92;
  vec3 p = vec3(n.x, n.y * cos(a) - n.z * sin(a), n.y * sin(a) + n.z * cos(a));
  return vec2(fract(atan(p.z, p.x) / (2. * PI) + .5 + rotation), .5 - asin(clamp(p.y, -1., 1.)) / PI);
}
void main() {
  float aspect = resolution.x / resolution.y;
  vec2 skyPoint = vec2((uv.x - .5) * aspect, uv.y);
  vec3 color = mix(vec3(.003, .012, .032), vec3(.009, .038, .086), 1. - uv.y);
  float haze = exp(-length((skyPoint - vec2(.55, .44)) * vec2(1.1, 1.7)) * 3.);
  color += vec3(.002, .012, .033) * haze;
  color += vec3(.46, .67, .94) * stars(skyPoint, 61., .006) * .78;
  color += vec3(.75, .85, 1.) * stars(skyPoint, 34., .009) * .85;
  color += vec3(.2, .4, .7) * stars(skyPoint, 105., .002) * .3;
  // A close orbital crop: the sphere's silhouette stays still as longitude changes.
  float radius = max(2.22, aspect * 1.04);
  vec2 p = vec2(skyPoint.x, uv.y + radius - .405);
  float distanceToLimb = length(p) - radius;
  float rotation = -.08 + time / 720.;
  float sunX = aspect * (.33 + .075 * sin(time * .013));
  float sunY = sqrt(max(0., radius * radius - sunX * sunX)) - radius + .405;
  vec2 sunPoint = vec2(sunX, sunY + .006);
  float sunDistance = length((skyPoint - sunPoint) * vec2(1., 1.25));
  vec3 sun = normalize(vec3(.95, .13 + .025 * sin(time * .013), -.5));
  if (distanceToLimb < 0.) {
    float z = sqrt(max(0., radius * radius - dot(p, p)));
    vec3 normal = vec3(p, z) / radius;
    vec2 earthUV = mapPoint(normal, rotation);
    vec3 ground = texture2D(surfaceMap, earthUV).rgb;
    vec3 cities = texture2D(lightMap, earthUV).rgb;
    float light = dot(normal, sun);
    float day = smoothstep(-.16, .3, light);
    float sunlit = max(light, 0.);
    color = ground * (.17 + sunlit * 1.15) * vec3(.45, .7, 1.05);
    color += vec3(.003, .012, .028) * (1. - day);
    float cityBrightness = max(cities.r, max(cities.g, cities.b));
    color += cities * vec3(1.2, .8, .44) * smoothstep(.035, .22, cityBrightness) * (1. - day) * 2.2;
    // Separate cloud longitude and altitude create gentle relative movement.
    vec3 cloudNormal = normalize(vec3(p, sqrt(max(0., (radius + .012) * (radius + .012) - dot(p, p)))));
    vec2 cloudUV = mapPoint(cloudNormal, rotation + .007 + time / 3600.);
    float cloud = texture2D(cloudMap, cloudUV).r;
    float shadow = texture2D(cloudMap, cloudUV + vec2(.0015, .001)).r;
    color *= 1. - shadow * .16 * day;
    color = mix(color, vec3(.58, .72, .9) * (.2 + sunlit * 1.65), cloud * .85);
    float rim = pow(1. - normal.z, 9.);
    color += vec3(.035, .37, .86) * rim * (.4 + day * .45);
    color += vec3(.13, .56, 1.) * exp(distanceToLimb * 250.) * .65;
  } else {
    float atmosphere = exp(-distanceToLimb * 66.);
    color += vec3(.025, .38, 1.) * atmosphere * .95;
    color += vec3(.015, .13, .4) * exp(-distanceToLimb * 15.) * .65;
  }
  // Restrained sunrise light moves continuously along the curved horizon.
  float horizonMask = smoothstep(-.035, .008, distanceToLimb);
  color += vec3(.3, .39, .55) * exp(-sunDistance * 17.) * horizonMask;
  color += vec3(1., .64, .32) * exp(-sunDistance * 62.) * horizonMask * .7;
  color += vec3(1., .94, .79) * exp(-sunDistance * 210.) * horizonMask;
  color *= 1. - .14 * smoothstep(.25, .85, abs(uv.x - .5));
  gl_FragColor = vec4(color, 1.);
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
  const textureExtension = canvas.clientWidth > 600 && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096 ? "webp" : "jpg";
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
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1_300_000 / Math.max(1, width * height)));
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(program, ["surfaceMap", "lightMap", "cloudMap"][index]), index);
      resolve();
    };
    image.onerror = reject; image.src = `/images/earth/${name}.${textureExtension}`;
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
