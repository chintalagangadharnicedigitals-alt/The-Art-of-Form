import * as THREE from 'three';

export class Scene02 {
  constructor(scene, cameraController, lighting, hotspotComponent) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.lighting = lighting;
    this.hotspot = hotspotComponent;
  }

  update(progress, sculpture, sceneManager) {
    // Local chapter progress: 0.25 to 0.50 mapped to 0.0 to 1.0
    const localProgress = Math.min(1.0, Math.max(0.0, (progress - 0.25) / 0.25));

    if (sculpture) {
      sculpture.position.y = 0;
      sculpture.rotation.y = Math.PI * 0.75 + localProgress * Math.PI * 0.85;
      sculpture.rotation.x = 0.2 * Math.sin(localProgress * Math.PI);

      // Component exploded view animation
      const userData = sculpture.userData;
      if (userData) {
        if (userData.bezel) userData.bezel.position.z = localProgress * 0.8;
        if (userData.glass) userData.glass.position.z = 0.38 + localProgress * 1.2;
        if (userData.dialBase) userData.dialBase.position.z = -0.12 - localProgress * 0.6;
        if (userData.gearGroup) userData.gearGroup.rotation.z += 0.03;
      }
    }

    // Camera moves around the object in an orbital path
    const camX = Math.sin(localProgress * Math.PI * 0.7) * 4.2;
    const camZ = Math.cos(localProgress * Math.PI * 0.7) * 6.8;
    const camY = 0.8 + Math.sin(localProgress * Math.PI) * 0.5;

    this.cameraController.setTarget(
      new THREE.Vector3(camX, camY, camZ),
      new THREE.Vector3(0, 0, 0)
    );

    // Lighting: Stronger metallic highlights
    this.lighting.setLightIntensity(9.0, 7.0, 0.5, 3.0);

    // Particles: Slightly increase
    if (sceneManager && sceneManager.particleMaterial) {
      sceneManager.particleMaterial.uniforms.uSize.value = 30.0 * Math.min(window.devicePixelRatio, 2);
    }

    // Hotspots active in Chapter 2
    if (this.hotspot) {
      this.hotspot.setVisible(localProgress > 0.1 && localProgress < 0.95);
    }
  }
}
