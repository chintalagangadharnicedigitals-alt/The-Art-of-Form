uniform float uTime;
uniform float uSize;

attribute float aScale;
attribute vec3 aRandomness;

varying vec3 vPosition;
varying float vScale;

void main() {
  vPosition = position;
  vScale = aScale;

  vec3 p = position;
  
  // Organic floating drift wave
  p.x += sin(uTime * 0.5 + aRandomness.x * 6.28) * 0.15;
  p.y += cos(uTime * 0.4 + aRandomness.y * 6.28) * 0.2;
  p.z += sin(uTime * 0.3 + aRandomness.z * 6.28) * 0.15;

  vec4 modelPosition = modelMatrix * vec4(p, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;

  gl_Position = projectionPosition;

  // Size attenuation based on depth distance
  gl_PointSize = uSize * aScale * (30.0 / -viewPosition.z);
}
