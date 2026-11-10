# Earth textures

Earth day, night and cloud maps by Solar System Scope, based on NASA imagery.
Source: https://www.solarsystemscope.com/textures/
License: Creative Commons Attribution 4.0 International
https://creativecommons.org/licenses/by/4.0/

Downloaded 2026-11-10. The main WebP files were resized from 8K to 4096 × 2048 and compressed; the cloud texture was converted to grayscale. The night-detail.webp and clouds-detail.webp variants preserve the original 8192 × 4096 resolution, converted to grayscale and compressed for capable desktop devices. Original 2K JPEG files are retained for mobile and devices with smaller texture limits (local filenames shortened).

- day.webp: https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg
- night.webp / night-detail.webp: https://www.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg
- clouds.webp / clouds-detail.webp: https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg

- day.jpg: https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg
- night.jpg: https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg
- clouds.jpg: https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg

The renderer maps these images onto a rotating sphere and adds lighting, independent cloud movement, atmospheric scattering effects, procedural stars and sunrise glow. Credit is also available in the application's Help panel.

`first-frame.webp` is a 1600 × 1000 capture of this renderer at time zero, using the desktop maps above. It is the loading and WebGL fallback image, with the same centered crop as the animated scene. Regenerate it from the renderer when changing its initial composition or lighting.
