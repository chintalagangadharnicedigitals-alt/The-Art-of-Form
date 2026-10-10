import { gsap } from 'gsap';

export class Loader {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.loaderEl = document.getElementById('loader');
    this.barEl = document.getElementById('loader-bar');
    this.percentEl = document.getElementById('loader-percent');
    this.progress = 0;
  }

  updateProgress(targetPercent, duration = 0.5) {
    gsap.to(this, {
      progress: targetPercent,
      duration: duration,
      ease: 'power2.out',
      onUpdate: () => {
        const val = Math.floor(this.progress);
        if (this.barEl) this.barEl.style.width = `${val}%`;
        if (this.percentEl) this.percentEl.innerText = val < 10 ? `0${val}` : val;
      },
      onComplete: () => {
        if (this.progress >= 100) {
          this.finish();
        }
      }
    });
  }

  finish() {
    gsap.to(this.loaderEl, {
      opacity: 0,
      duration: 1.2,
      ease: 'power3.inOut',
      onComplete: () => {
        this.loaderEl.classList.add('is-hidden');
        document.body.classList.remove('is-loading');
        if (typeof this.onComplete === 'function') {
          this.onComplete();
        }
      }
    });
  }
}
