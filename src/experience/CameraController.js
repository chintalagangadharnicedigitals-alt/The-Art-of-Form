import * as THREE from 'three';
import { gsap } from 'gsap';

export class CameraController {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    // Initial camera position
    this.camera.position.set(0, 0, 7.5);

    // Current & Target positions for lerp
    this.position = new THREE.Vector3().copy(this.camera.position);
    this.targetPosition = new THREE.Vector3().copy(this.camera.position);
    
    this.lookAt = new THREE.Vector3(0, 0, 0);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);

    // Mouse parallax offset
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };

    this.lerpSpeed = 0.05;
    this.parallaxFactor = 0.4;
    
    // Accessibility check: Reduced Motion
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.prefersReducedMotion) {
      this.parallaxFactor = 0.05;
    }

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => {
      if (this.prefersReducedMotion) return;
      this.targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    
    // Adjust FOV on mobile devices to keep model well framed
    if (window.innerWidth < 768) {
      this.camera.fov = 55;
    } else {
      this.camera.fov = 45;
    }
    
    this.camera.updateProjectionMatrix();
  }

  setTarget(pos, lookAtTarget) {
    if (pos) this.targetPosition.copy(pos);
    if (lookAtTarget) this.targetLookAt.copy(lookAtTarget);
  }

  focusOnHotspot(hotspotPos, lookAtPos) {
    const targetCamPos = new THREE.Vector3(
      hotspotPos.x * 1.5 + 0.5,
      hotspotPos.y * 1.5 + 0.3,
      hotspotPos.z + 3.0
    );

    gsap.to(this.targetPosition, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    gsap.to(this.targetLookAt, {
      x: lookAtPos.x,
      y: lookAtPos.y,
      z: lookAtPos.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });
  }

  update() {
    // Increment internal clock for camera micro-breathing
    this.time = (this.time || 0) + 0.015;

    // Lerp mouse parallax
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    // Organic camera breathing offset (reduced if prefers-reduced-motion is active)
    const breathFactor = this.prefersReducedMotion ? 0.01 : 0.08;
    const breathX = Math.sin(this.time * 0.8) * breathFactor;
    const breathY = Math.cos(this.time * 0.6) * breathFactor;

    // Smoothly interpolate position
    this.position.x += (this.targetPosition.x + this.mouse.x * this.parallaxFactor + breathX - this.position.x) * this.lerpSpeed;
    this.position.y += (this.targetPosition.y + this.mouse.y * this.parallaxFactor + breathY - this.position.y) * this.lerpSpeed;
    this.position.z += (this.targetPosition.z - this.position.z) * this.lerpSpeed;

    this.camera.position.copy(this.position);

    // Smoothly interpolate lookAt target
    this.lookAt.x += (this.targetLookAt.x - this.lookAt.x) * this.lerpSpeed;
    this.lookAt.y += (this.targetLookAt.y - this.lookAt.y) * this.lerpSpeed;
    this.lookAt.z += (this.targetLookAt.z - this.lookAt.z) * this.lerpSpeed;

    this.camera.lookAt(this.lookAt);

    // Subtle Dutch angle camera roll on mouse movement
    if (!this.prefersReducedMotion) {
      this.camera.rotation.z = -this.mouse.x * 0.03;
    }
  }
}
