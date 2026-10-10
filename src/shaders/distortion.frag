uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uDistortion;
uniform float uChromatic;
uniform float uVignette;

varying vec2 vUv;

// Simplex/Pseudo noise for cinematic film grain
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  
  // Center coordinates (-0.5 to 0.5)
  vec2 centeredUv = uv - 0.5;
  float dist = length(centeredUv);

  // Barrel distortion vector
  vec2 distUv = uv + centeredUv * (dist * dist * uDistortion);

  // Chromatic Aberration
  float shift = uChromatic * dist * 0.012;
  float r = texture2D(tDiffuse, distUv - vec2(shift, 0.0)).r;
  float g = texture2D(tDiffuse, distUv).g;
  float b = texture2D(tDiffuse, distUv + vec2(shift, 0.0)).b;

  vec3 color = vec3(r, g, b);

  // Luxury Specular Gold Bloom Tint on Highlights
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  if (luminance > 0.72) {
    color += vec3(0.18, 0.14, 0.05) * (luminance - 0.72) * 2.2;
  }

  // Soft Cinematic Vignette
  float vignette = smoothstep(0.85, 0.2, dist * uVignette);
  color *= vignette;

  // Subtle film grain
  float grain = (random(uv * uTime) - 0.5) * 0.02;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
