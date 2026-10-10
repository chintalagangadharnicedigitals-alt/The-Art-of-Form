import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollController {
  constructor(sceneManager, navigation, soundComponent) {
    this.sceneManager = sceneManager;
    this.navigation = navigation;
    this.sound = soundComponent;
    
    this.lenis = null;
    this.timeline = null;
    this.scrollProgress = 0;
    this.lastStageIdx = -1;
    
    this.initLenis();
    this.initScrollTimeline();
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false,
      touchMultiplier: 1.5,
    });

    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  initScrollTimeline() {
    const mainContainer = document.getElementById('scroll-container');
    if (!mainContainer) return;

    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: mainContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate: (self) => {
          this.scrollProgress = self.progress;
          
          // Determine stage (0 to 8)
          const activeStageIdx = Math.min(8, Math.floor(self.progress * 9));

          // Trigger debounced sound effect when entering a new stage
          if (activeStageIdx !== this.lastStageIdx) {
            this.lastStageIdx = activeStageIdx;
            if (this.sound && typeof this.sound.onStageChange === 'function') {
              this.sound.onStageChange(activeStageIdx);
            }
          }
          
          if (this.navigation) {
            this.navigation.updateProgress(self.progress, activeStageIdx);
          }

          if (this.sceneManager) {
            this.sceneManager.onScrollUpdate(self.progress, activeStageIdx);
          }
        }
      }
    });

    // Animate text sections on scroll smoothly with scrub
    const textElements = document.querySelectorAll('.animate-text');
    textElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            end: 'top 55%',
            scrub: 0.5
          }
        }
      );
    });
  }
}
