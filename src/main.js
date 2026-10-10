import './style.css';
import { Loader } from './components/Loader.js';
import { Cursor } from './components/Cursor.js';
import { SoundToggle } from './components/SoundToggle.js';
import { Navigation } from './components/Navigation.js';
import { Hotspot } from './components/Hotspot.js';
import { SceneManager } from './experience/SceneManager.js';
import { ScrollController } from './experience/ScrollController.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    // 1. Initialize UI & Interactive Sound Component
    this.cursor = new Cursor();
    this.sound = new SoundToggle();
    
    // WebGL Canvas element
    const canvas = document.getElementById('webgl-canvas');
    
    // 2. Initialize Hotspots
    this.hotspot = new Hotspot(null, this.sound);

    // 3. Initialize 3D WebGL Scene Manager
    this.sceneManager = new SceneManager(canvas, this.hotspot);

    // 4. Initialize Loader & Preload Assets
    this.loader = new Loader(() => {
      this.onReady();
    });

    this.loader.updateProgress(25);
    
    await this.sceneManager.loadAssets((progress) => {
      this.loader.updateProgress(25 + progress * 0.75);
    });

    this.loader.updateProgress(100, 0.6);
  }

  onReady() {
    // 5. Initialize Lenis & GSAP ScrollController with Sound Engine
    this.scrollController = new ScrollController(this.sceneManager, null, this.sound);
    this.navigation = new Navigation(this.scrollController, this.sound);
    this.scrollController.navigation = this.navigation;

    // Initial scroll update for Stage 1
    this.sceneManager.onScrollUpdate(0, 0);

    // 6. Start Main Render Loop
    this.tick();
  }

  tick() {
    this.sceneManager.render();
    requestAnimationFrame(() => this.tick());
  }
}

// Instantiate App when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
