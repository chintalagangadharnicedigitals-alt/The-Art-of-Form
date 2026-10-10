uniform vec3 uColor;

varying vec3 vPosition;
varying float vScale;

void main() {
  // Calculate distance from point center (0.5, 0.5)
  float dist = length(gl_PointCoord - vec2(0.5));
  
  // Smooth circular edge with soft glow falloff
  float alpha = smoothstep(0.5, 0.0, dist);

  // Core glow enhancement
  float coreGlow = smoothstep(0.2, 0.0, dist) * 0.5;

  vec3 finalColor = uColor + vec3(coreGlow);

  gl_FragColor = vec4(finalColor, alpha * 0.75);
}
