import * as THREE from 'three';

export class Scene04 {
  constructor(scene, cameraController, lighting) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.lighting = lighting;
  }

  update(progress, sculpture, sceneManager) {
    // Local chapter progress: 0.75 to 1.0 mapped to 0.0 to 1.0
    const localProgress = Math.min(1.0, Math.max(0.0, (progress - 0.75) / 0.25));

    if (sculpture) {
      sculpture.rotation.y = Math.PI * 2.1 + localProgress * 0.6;
      sculpture.rotation.x = 0.15;
      sculpture.position.y = 0;

      // Fully reassembled
      const userData = sculpture.userData;
      if (userData) {
        if (userData.bezel) userData.bezel.position.z = 0;
        if (userData.glass) userData.glass.position.z = 0.38;
        if (userData.dialBase) userData.dialBase.position.z = -0.12;
        if (userData.gearGroup) userData.gearGroup.rotation.z += 0.015;
      }
    }

    // Camera slowly pulls backward for complete visual reveal
    const camZ = 3.3 + localProgress * 5.2; // Pull back to 8.5
    const camY = 0.2 + localProgress * 0.8;
    const camX = 0;

    this.cameraController.setTarget(
      new THREE.Vector3(camX, camY, camZ),
      new THREE.Vector3(0, 0, 0)
    );

    // Lighting: Bright cinematic highlight spotlight
    this.lighting.setLightIntensity(14.0, 9.0, 0.6, 4.0);

    // Particles expand into environment
    if (sceneManager && sceneManager.particleMaterial) {
      sceneManager.particleMaterial.uniforms.uSize.value = (25.0 + localProgress * 15.0) * Math.min(window.devicePixelRatio, 2);
    }
  }
}
