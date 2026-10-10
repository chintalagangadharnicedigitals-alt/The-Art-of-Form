import * as THREE from 'three';

export class Scene03 {
  constructor(scene, cameraController, lighting) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.lighting = lighting;
  }

  update(progress, sculpture, sceneManager) {
    // Local chapter progress: 0.50 to 0.75 mapped to 0.0 to 1.0
    const localProgress = Math.min(1.0, Math.max(0.0, (progress - 0.5) / 0.25));

    if (sculpture) {
      sculpture.rotation.y = Math.PI * 1.6 + localProgress * Math.PI * 0.5;
      sculpture.rotation.x = 0.35 * Math.sin(localProgress * Math.PI);

      // Re-align exploded components back towards core
      const userData = sculpture.userData;
      if (userData) {
        if (userData.bezel) userData.bezel.position.z = (1.0 - localProgress) * 0.8;
        if (userData.glass) userData.glass.position.z = 0.38 + (1.0 - localProgress) * 1.2;
        if (userData.dialBase) userData.dialBase.position.z = -0.12 - (1.0 - localProgress) * 0.6;
        if (userData.gearGroup) userData.gearGroup.rotation.z += 0.02;
      }
    }

    // Camera moves extremely close to reveal material & reflection details
    const camZ = 5.5 - localProgress * 2.2; // Zoom in to macro distance 3.3
    const camY = 0.6 - localProgress * 0.4;
    const camX = Math.sin(localProgress * Math.PI) * 0.8;

    this.cameraController.setTarget(
      new THREE.Vector3(camX, camY, camZ),
      new THREE.Vector3(0, 0, 0)
    );

    // Lighting: Strong rim light for edge specular highlights
    this.lighting.setLightIntensity(11.0, 10.0, 0.4, 2.5);

    // Particles: Subtle
    if (sceneManager && sceneManager.particleMaterial) {
      sceneManager.particleMaterial.uniforms.uSize.value = 22.0 * Math.min(window.devicePixelRatio, 2);
    }
  }
}
