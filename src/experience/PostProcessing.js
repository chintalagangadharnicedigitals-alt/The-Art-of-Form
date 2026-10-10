import * as THREE from 'three';
import distortionVert from '../shaders/distortion.vert?raw';
import distortionFrag from '../shaders/distortion.frag?raw';

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;

    // Detect mobile device to disable heavy postprocessing for max performance
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.enabled = false;
    }

    this.initPass();
  }

  initPass() {
    if (!this.enabled) return;

    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );

    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: distortionVert,
      fragmentShader: distortionFrag,
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uDistortion: { value: 0.12 },
        uChromatic: { value: 0.25 },
        uVignette: { value: 1.1 }
      }
    });

    this.postQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.postMaterial
    );

    this.postScene = new THREE.Scene();
    this.postScene.add(this.postQuad);
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  onResize(width, height) {
    if (!this.enabled) return;
    this.renderTarget.setSize(width, height);
  }

  render(time) {
    if (!this.enabled) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Render scene into renderTarget
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // Render post-processing quad to screen
    this.postMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.postMaterial.uniforms.uTime.value = time;

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }
}
