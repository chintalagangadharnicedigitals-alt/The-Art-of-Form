export class Cursor {
  constructor() {
    this.cursorEl = document.getElementById('custom-cursor');
    if (!this.cursorEl || window.matchMedia('(pointer: coarse)').matches) return;

    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.speed = 0.18;

    this.init();
  }

  init() {
    window.addEventListener('mousemove', (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    });

    this.bindHoverEvents();
    this.render();
  }

  bindHoverEvents() {
    const interactables = document.querySelectorAll('a, button, .hotspot-marker, .primary-btn');
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (el.classList.contains('hotspot-marker')) {
          this.cursorEl.classList.add('is-hotspot');
        } else if (el.classList.contains('primary-btn') || el.classList.contains('nav-chapter-btn')) {
          this.cursorEl.classList.add('is-button');
        } else {
          this.cursorEl.classList.add('is-hover');
        }
      });

      el.addEventListener('mouseleave', () => {
        this.cursorEl.classList.remove('is-hover', 'is-hotspot', 'is-button');
      });
    });
  }

  render() {
    this.pos.x += (this.target.x - this.pos.x) * this.speed;
    this.pos.y += (this.target.y - this.pos.y) * this.speed;

    if (this.cursorEl) {
      this.cursorEl.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
    }

    requestAnimationFrame(() => this.render());
  }
}
