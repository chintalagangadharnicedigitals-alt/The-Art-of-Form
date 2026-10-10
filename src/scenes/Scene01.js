import * as THREE from 'three';

export class Scene01 {
  constructor(scene, cameraController, lighting) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.lighting = lighting;
  }

  update(progress, sculpture, sceneManager) {
    // Local chapter progress: 0.0 to 0.25 mapped to 0.0 to 1.0
    const localProgress = Math.min(1.0, Math.max(0.0, progress / 0.25));

    if (sculpture) {
      // Emergence from dark bottom with rotational reveal & slow breathing
      sculpture.position.y = (1.0 - localProgress) * -2.2;
      sculpture.rotation.y = localProgress * Math.PI * 0.75;
      sculpture.rotation.x = (1.0 - localProgress) * 0.35;
      
      const scale = 0.65 + localProgress * 0.35;
      sculpture.scale.set(scale, scale, scale);
    }

    // Camera: Far camera (11.5) -> slowly approaches object (7.5)
    const camZ = 11.5 - localProgress * 4.0;
    const camY = 0.6 - localProgress * 0.4;
    this.cameraController.setTarget(
      new THREE.Vector3(0, camY, camZ),
      new THREE.Vector3(0, 0, 0)
    );

    // Lighting: Dark and mysterious
    this.lighting.setLightIntensity(
      2.0 + localProgress * 4.0, // Key light
      1.5 + localProgress * 2.5, // Rim light
      0.2 + localProgress * 0.2, // Ambient light
      1.0 + localProgress * 1.0  // Fill light
    );

    // Particles: Minimal (opacity 0.3)
    if (sceneManager && sceneManager.particleMaterial) {
      sceneManager.particleMaterial.uniforms.uSize.value = (15.0 + localProgress * 10.0) * Math.min(window.devicePixelRatio, 2);
    }
  }
}
