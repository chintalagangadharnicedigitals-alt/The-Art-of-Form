import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'LightingGroup';

    this.initLights();
    this.scene.add(this.group);
  }

  initLights() {
    // Light tracking target that follows the watch
    this.lightTarget = new THREE.Object3D();
    this.lightTarget.position.set(1.4, 0, 0);
    this.group.add(this.lightTarget);

    // 1. Dark Atmospheric Ambient Light
    this.ambientLight = new THREE.AmbientLight(0x101713, 0.85);
    this.group.add(this.ambientLight);

    // 2. Key Light (Crisp Clean Studio Spotlight with soft falloff)
    this.keyLight = new THREE.SpotLight(0xebf5ef, 8);
    this.keyLight.position.set(5, 6, 6);
    this.keyLight.target = this.lightTarget;
    this.keyLight.angle = Math.PI / 3.8;
    this.keyLight.penumbra = 0.8;
    this.keyLight.decay = 1.4;
    this.keyLight.distance = 28;
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0001;
    this.group.add(this.keyLight);

    // 3. Fill Light (Soft Sage-Slate Cool Light for Shadow Detail)
    this.fillLight = new THREE.SpotLight(0x3a4840, 4);
    this.fillLight.position.set(-6, 4, 4);
    this.fillLight.target = this.lightTarget;
    this.fillLight.angle = Math.PI / 3;
    this.fillLight.penumbra = 0.9;
    this.group.add(this.fillLight);

    // 4. Rim Light (Sage Green Accent for Edge Silhouette & Highlight Sweeps)
    this.rimLight = new THREE.SpotLight(0x7da38d, 7);
    this.rimLight.position.set(-5, -3, -4);
    this.rimLight.target = this.lightTarget;
    this.rimLight.angle = Math.PI / 3;
    this.rimLight.penumbra = 0.6;
    this.group.add(this.rimLight);

    // 5. Backlight / Pale Sage Halo Rim Light (Dramatic Edge Gleam)
    this.backRimLight = new THREE.SpotLight(0xc5ded0, 9);
    this.backRimLight.position.set(3, 7, -6);
    this.backRimLight.target = this.lightTarget;
    this.backRimLight.angle = Math.PI / 4;
    this.backRimLight.penumbra = 0.7;
    this.group.add(this.backRimLight);

    // 6. Accent / Specular Point Light (Dynamic Specular Highlight)
    this.specularLight = new THREE.PointLight(0xebf5ef, 5, 12);
    this.specularLight.position.set(1.4, 0, 3);
    this.group.add(this.specularLight);
  }

  setTargetPosition(x, y, z) {
    if (this.lightTarget) {
      this.lightTarget.position.set(x, y, z);
    }
  }

  setLightIntensity(keyIntensity, rimIntensity, ambientIntensity, fillIntensity, backIntensity) {
    if (keyIntensity !== undefined) this.keyLight.intensity = keyIntensity;
    if (rimIntensity !== undefined) this.rimLight.intensity = rimIntensity;
    if (ambientIntensity !== undefined) this.ambientLight.intensity = ambientIntensity;
    if (fillIntensity !== undefined) this.fillLight.intensity = fillIntensity;
    if (backIntensity !== undefined && this.backRimLight) this.backRimLight.intensity = backIntensity;
  }

  update(time) {
    // Animated gold rim light position sweep across watch contours
    if (this.rimLight) {
      this.rimLight.position.x = Math.sin(time * 0.4) * 6.0 - 1.0;
      this.rimLight.position.z = Math.cos(time * 0.4) * 5.0 - 4.0;
    }

    // Dynamic specular point light micro-drift near watch
    if (this.specularLight && this.lightTarget) {
      this.specularLight.position.x = this.lightTarget.position.x + Math.cos(time * 0.6) * 1.5;
      this.specularLight.position.y = this.lightTarget.position.y + Math.sin(time * 0.5) * 1.2;
    }
  }
}
