import * as THREE from 'three';
import { CameraController } from './CameraController.js';
import { Lighting } from './Lighting.js';
import { PostProcessing } from './PostProcessing.js';
import { AssetManager } from './AssetManager.js';

export class SceneManager {
  constructor(canvas, hotspotComponent) {
    this.canvas = canvas;
    this.hotspot = hotspotComponent;
    this.isTabActive = true;
    this.time = 0;
    this.currentScrollProgress = 0;
    this.activeChapterIdx = 0;
    this.currentFinish = 'gold';

    // Base scroll-driven watch targets
    this.baseWatchPos = new THREE.Vector3(1.6, 0, 0);
    this.baseWatchRot = new THREE.Vector3(0.1, 0.4, 0);
    this.targetCamPos = new THREE.Vector3(0, 0.2, 7.2);
    this.targetLookAt = new THREE.Vector3(1.4, 0, 0);

    // Interactive Drag / Orbit State
    this.userRotX = 0;
    this.userRotY = 0;
    this.dragVelX = 0;
    this.dragVelY = 0;
    this.isDragging = false;
    this.previousPointerPosition = { x: 0, y: 0 };
    this.is360InspectActive = false;

    this.initScene();
    this.initEnvironment();
    this.initParticles();
    this.initDragControls();
    this.initListeners();
  }

  initScene() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f0d);
    this.scene.fog = new THREE.FogExp2(0x0a0f0d, 0.035);

    // 2. Camera Controller
    this.cameraController = new CameraController();

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Tone Mapping & Color Space
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting & Post Processing
    this.lighting = new Lighting(this.scene);
    this.postProcessing = new PostProcessing(
      this.renderer,
      this.scene,
      this.cameraController.camera
    );

    // 5. Asset Manager
    this.assetManager = new AssetManager();
  }

  async loadAssets(onProgress) {
    this.assetManager.onProgress = onProgress;

    // Load Studio Environment Map for realistic metallic & glass reflections
    const envMap = await this.assetManager.loadEnvironment(this.renderer);
    if (envMap) {
      this.scene.environment = envMap;
    }

    // Load 3D Chronograph Watch model
    this.sculpture = await this.assetManager.loadModel('/assets/models/hero-object.glb');
    this.scene.add(this.sculpture);

    // Setup initial finish
    this.setFinish('gold');

    // Setup hotspot camera controller reference
    if (this.hotspot) {
      this.hotspot.cameraController = this.cameraController;
      this.hotspot.update(this.cameraController.camera, this.sculpture.matrixWorld);
    }
  }

  setFinish(finishName) {
    this.currentFinish = finishName;
    if (this.sculpture && this.sculpture.userData && typeof this.sculpture.userData.setFinish === 'function') {
      this.sculpture.userData.setFinish(finishName);
    }
  }

  toggle360Inspect(forceState) {
    this.is360InspectActive = forceState !== undefined ? forceState : !this.is360InspectActive;
    return this.is360InspectActive;
  }

  resetView() {
    this.userRotX = 0;
    this.userRotY = 0;
    this.dragVelX = 0;
    this.dragVelY = 0;
    this.is360InspectActive = false;
  }

  initEnvironment() {
    // Dark Reflective Studio Floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x090e0c,
      roughness: 0.18,
      metalness: 0.9,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = -2.8;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Sculpted Dark Obsidian Mineral Pedestal under watch (matches reference image rock surface)
    const rockGeo = new THREE.CylinderGeometry(2.6, 3.4, 0.9, 14, 3);
    const posAttr = rockGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const noise = (Math.sin(vx * 3.5) * Math.cos(vz * 3.5)) * 0.14;
      posAttr.setXYZ(i, vx + noise, vy + noise * 0.5, vz + noise);
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x0d1411,
      roughness: 0.35,
      metalness: 0.5,
      envMapIntensity: 1.2
    });
    this.rockBase = new THREE.Mesh(rockGeo, rockMat);
    this.rockBase.position.set(1.4, -2.4, 0);
    this.rockBase.receiveShadow = true;
    this.scene.add(this.rockBase);
  }

  initParticles() {
    const particleCount = window.innerWidth < 768 ? 250 : 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const randomness = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      
      scales[i] = Math.random() * 0.8 + 0.2;

      randomness[i * 3] = Math.random();
      randomness[i * 3 + 1] = Math.random();
      randomness[i * 3 + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        attribute float aScale;
        attribute vec3 aRandomness;
        varying vec3 vPosition;
        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * 0.5 + aRandomness.x * 6.28) * 0.3;
          pos.y += cos(uTime * 0.4 + aRandomness.y * 6.28) * 0.4;
          pos.z += sin(uTime * 0.6 + aRandomness.z * 6.28) * 0.3;
          vPosition = pos;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = uSize * aScale * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vPosition;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * 0.6;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 30.0 * Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color(0x7da38d) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  /**
   * 360-Degree Interactive Drag & Touch Orbit Gesture Controls with Smooth Inertia
   */
  initDragControls() {
    const onPointerDown = (e) => {
      // Ignore clicks on buttons/modals
      if (e.target.closest('button, a, .modal-card, .hotspot-marker')) return;

      this.isDragging = true;
      this.previousPointerPosition = {
        x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
        y: e.clientY || (e.touches && e.touches[0].clientY) || 0
      };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;

      const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const deltaX = currentX - this.previousPointerPosition.x;
      const deltaY = currentY - this.previousPointerPosition.y;

      this.dragVelY = deltaX * 0.008;
      this.dragVelX = deltaY * 0.008;

      this.userRotY += this.dragVelY;
      this.userRotX += this.dragVelX;

      this.userRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.userRotX));

      this.previousPointerPosition = { x: currentX, y: currentY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });
  }

  /**
   * Continuous Hermite Keyframe Interpolator across all 9 Storytelling Stages
   */
  onScrollUpdate(progress, activeChapterIdx) {
    this.currentScrollProgress = progress;
    this.activeChapterIdx = activeChapterIdx;

    const isMobile = window.innerWidth < 768;
    const posXFactor = isMobile ? 0.35 : 1.0;

    // 9 Storytelling Stages matching the visual reference:
    // 0: Reveal, 1: Rotation, 2: Dial, 3: Engineering, 4: Movement, 5: Materials, 6: Profile, 7: Legacy, 8: Collection
    const keyframes = [
      // 0: Reveal (Hero 3/4 front view on right, warm golden gleam)
      {
        watchPos: [1.45 * posXFactor, 0.0, 0.0],
        watchRot: [0.12, 0.38, 0.0],
        camPos: [0.0, 0.2, 7.5],
        lookAt: [1.3 * posXFactor, 0.0, 0.0],
        lights: [9.0, 8.0, 0.5, 3.0, 9.0]
      },
      // 1: Rotation (Watch 3/4 angled, ready for turntable interaction)
      {
        watchPos: [1.4 * posXFactor, 0.0, 0.0],
        watchRot: [0.18, 0.82, 0.05],
        camPos: [0.0, 0.2, 7.2],
        lookAt: [1.3 * posXFactor, 0.0, 0.0],
        lights: [10.0, 9.0, 0.6, 3.5, 10.0]
      },
      // 2: Dial (Extreme Macro zoom on dial, indices, sub-dials)
      {
        watchPos: [1.3 * posXFactor, -0.12, 0.0],
        watchRot: [0.04, 0.1, 0.0],
        camPos: [0.6 * posXFactor, 0.0, 4.3],
        lookAt: [1.3 * posXFactor, -0.05, 0.0],
        lights: [12.0, 9.0, 0.7, 4.0, 7.0]
      },
      // 3: Engineering (Macro zoom on crown monogram 'A' and dual pushers)
      {
        watchPos: [0.95 * posXFactor, 0.0, 0.0],
        watchRot: [0.08, 1.48, 0.12],
        camPos: [0.6 * posXFactor, 0.05, 4.2],
        lookAt: [1.7 * posXFactor, 0.0, 0.0],
        lights: [13.0, 11.0, 0.6, 4.5, 11.0]
      },
      // 4: Movement (Exhibition caseback 180° rotation, visible rotor and gears)
      {
        watchPos: [1.3 * posXFactor, 0.0, 0.0],
        watchRot: [-0.15, Math.PI + 0.15, 0.0],
        camPos: [0.4 * posXFactor, 0.1, 4.7],
        lookAt: [1.3 * posXFactor, 0.0, 0.0],
        lights: [12.0, 12.0, 0.7, 4.0, 10.0]
      },
      // 5: Materials (Materials showcase with real-time finish switching)
      {
        watchPos: [1.4 * posXFactor, 0.0, 0.0],
        watchRot: [0.15, 0.45, 0.0],
        camPos: [0.0, 0.15, 6.8],
        lookAt: [1.3 * posXFactor, 0.0, 0.0],
        lights: [10.0, 9.0, 0.6, 3.5, 8.0]
      },
      // 6: Profile (Low-angle edge profile showing slim case and sapphire dome)
      {
        watchPos: [1.2 * posXFactor, -0.22, 0.0],
        watchRot: [0.35, Math.PI * 0.52, -0.22],
        camPos: [0.0, -0.15, 6.2],
        lookAt: [1.2 * posXFactor, -0.2, 0.0],
        lights: [13.0, 13.0, 0.5, 4.5, 12.0]
      },
      // 7: Legacy (Majestic standing hero with golden rim lighting)
      {
        watchPos: [1.4 * posXFactor, -0.05, 0.0],
        watchRot: [0.12, 0.38, 0.0],
        camPos: [0.0, 0.15, 7.3],
        lookAt: [1.3 * posXFactor, 0.0, 0.0],
        lights: [14.0, 12.0, 0.7, 4.0, 14.0]
      },
      // 8: Collection (Watch softly recedes into background depth)
      {
        watchPos: [0.0, 1.2, -3.2],
        watchRot: [0.2, Math.PI * 2 + 0.4, 0.0],
        camPos: [0.0, 0.0, 9.6],
        lookAt: [0.0, 0.0, 0.0],
        lights: [8.0, 7.0, 0.5, 3.0, 7.0]
      }
    ];

    const clamped = Math.max(0, Math.min(0.9999, progress));
    const stageFloat = clamped * (keyframes.length - 1);
    const i = Math.floor(stageFloat);
    const frac = stageFloat - i;
    // Smooth hermite ease curve
    const p = frac * frac * (3 - 2 * frac);

    const k1 = keyframes[i];
    const k2 = keyframes[i + 1] || k1;

    const lerpArr = (a, b, t) => a.map((val, idx) => val + (b[idx] - val) * t);

    const pos = lerpArr(k1.watchPos, k2.watchPos, p);
    const rot = lerpArr(k1.watchRot, k2.watchRot, p);
    const cam = lerpArr(k1.camPos, k2.camPos, p);
    const look = lerpArr(k1.lookAt, k2.lookAt, p);
    const lit = lerpArr(k1.lights, k2.lights, p);

    this.baseWatchPos.set(pos[0], pos[1], pos[2]);
    this.baseWatchRot.set(rot[0], rot[1], rot[2]);
    this.targetCamPos.set(cam[0], cam[1], cam[2]);
    this.targetLookAt.set(look[0], look[1], look[2]);

    if (this.lighting) {
      this.lighting.setLightIntensity(lit[0], lit[1], lit[2], lit[3], lit[4]);
      this.lighting.setTargetPosition(pos[0], pos[1], pos[2]);
    }

    if (this.rockBase) {
      this.rockBase.position.x = pos[0];
      // Rock fades/lowers during macro and caseback views
      const hideRock = (i === 2 || i === 3 || i === 4 || i === 8);
      this.rockBase.visible = !hideRock;
    }

    // Update hotspots visibility
    if (this.hotspot) {
      this.hotspot.setVisible(progress > 0.08 && progress < 0.88);
    }
  }

  initListeners() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.postProcessing.onResize(w, h);
      if (this.particleMaterial) {
        this.particleMaterial.uniforms.uSize.value = 30.0 * Math.min(window.devicePixelRatio, 2);
      }
    });

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
    });
  }

  render() {
    if (!this.isTabActive) return;

    this.time += 0.016;

    // Damp drag velocity when pointer up
    if (!this.isDragging) {
      this.userRotY += this.dragVelY;
      this.userRotX += this.dragVelX;
      this.dragVelY *= 0.92;
      this.dragVelX *= 0.92;
    }

    // 360-Degree Turntable Spin Mode (Smooth continuous Y rotation)
    if (this.is360InspectActive) {
      this.userRotY += 0.015;
    }

    // Apply Watch Position and Rotation per frame
    if (this.sculpture) {
      const finalRotX = this.baseWatchRot.x + this.userRotX;
      const finalRotY = this.baseWatchRot.y + this.userRotY;
      const finalRotZ = this.baseWatchRot.z;

      this.sculpture.rotation.x += (finalRotX - this.sculpture.rotation.x) * 0.1;
      this.sculpture.rotation.y += (finalRotY - this.sculpture.rotation.y) * 0.1;
      this.sculpture.rotation.z += (finalRotZ - this.sculpture.rotation.z) * 0.1;
      this.sculpture.position.lerp(this.baseWatchPos, 0.1);
    }

    // Dynamic Lighting position update
    if (this.lighting && typeof this.lighting.update === 'function') {
      this.lighting.update(this.time);
    }

    // Update Camera controller interpolation
    if (this.cameraController) {
      this.cameraController.setTarget(this.targetCamPos, this.targetLookAt);
      this.cameraController.update();
    }

    // Kinetic Animation of Watch Mechanics
    if (this.sculpture && this.sculpture.userData) {
      const u = this.sculpture.userData;

      // 28,800 VPH Sweeping Chronograph Second Hand
      if (u.secHand) {
        u.secHand.rotation.z = -this.time * 1.6;
      }
      // Slow minute hand drift
      if (u.minHand) {
        u.minHand.rotation.z = -this.time * 0.08;
      }
      // Hour hand
      if (u.hourHand) {
        u.hourHand.rotation.z = -this.time * 0.015;
      }
      // 6 o'clock Running Seconds Subdial Hand
      if (u.subHand6) {
        u.subHand6.rotation.z = -this.time * 2.2;
      }
      // 3 o'clock 30 MIN Chrono Counter Subdial Hand
      if (u.subHand3) {
        u.subHand3.rotation.z = -this.time * 0.18;
      }
      // 9 o'clock 12 HR Chrono Counter Subdial Hand
      if (u.subHand9) {
        u.subHand9.rotation.z = -this.time * 0.05;
      }

      // Automatic Mechanical Oscillating Rotor
      if (u.rotorMesh) {
        u.rotorMesh.rotation.z = Math.sin(this.time * 1.5) * 0.85 + Math.sin(this.time * 0.6) * 0.35;
      }

      // Moving Gear Train in mechanical heart
      if (u.gears && Array.isArray(u.gears)) {
        u.gears.forEach((gear, idx) => {
          gear.rotation.z += (idx % 2 === 0 ? 1 : -1) * 0.035;
        });
      }
    }

    // Floating particles shader uniform update
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime.value = this.time;
    }

    // Update 3D Hotspot positions
    if (this.hotspot && this.sculpture) {
      this.hotspot.update(this.cameraController.camera, this.sculpture.matrixWorld);
    }

    // Post-Processing or Renderer pass
    this.postProcessing.render(this.time);
  }
}
