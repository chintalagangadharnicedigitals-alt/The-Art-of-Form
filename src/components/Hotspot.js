import * as THREE from 'three';

export class Hotspot {
  constructor(cameraController, soundComponent) {
    this.cameraController = cameraController;
    this.sound = soundComponent;
    this.container = document.getElementById('hotspot-container');
    this.modal = document.getElementById('hotspot-modal');
    this.closeBtn = document.getElementById('modal-close-btn');
    
    this.modalTitle = document.getElementById('modal-title');
    this.modalTag = document.getElementById('modal-tag');
    this.modalDesc = document.getElementById('modal-desc');
    this.modalSpecs = document.getElementById('modal-specs');
    
    this.hotspotsData = [
      {
        id: 'bezel',
        title: 'BEZEL & GEOMETRY',
        tag: 'CASE SPECIFICATION',
        position: new THREE.Vector3(1.2, 1.4, 0.4),
        desc: 'Laser micro-sculpted outer bezel crafted from 18k Gold & Grade-5 Brushed Titanium with hand-polished satin chamfers.',
        specs: [
          { key: 'Case Diameter', val: '42.0 mm / 11.5 mm Profile' },
          { key: 'Material', val: '18k Gold & Grade-5 Titanium' },
          { key: 'Tolerance', val: '± 0.001 mm Laser Micro-Milled' },
          { key: 'Water Resistance', val: '50 Meters / 5 ATM' }
        ]
      },
      {
        id: 'dial',
        title: 'CHRONOGRAPH DIAL',
        tag: 'HOROLOGICAL ARCHITECTURE',
        position: new THREE.Vector3(-0.4, 0.2, 0.35),
        desc: 'Deep matte black dial featuring concentric guilloche micro-lines, hand-applied gold hour markers, and triple sub-dial registers.',
        specs: [
          { key: 'Dial Pattern', val: 'Radial Sunburst Guilloche' },
          { key: 'Sub-Dials', val: '30-Min, 60-Sec, 12-Hr Counters' },
          { key: 'Indices', val: 'Faceted 18k Gold Diamond-Cut' },
          { key: 'Luminescence', val: 'Super-LumiNova Grade X1' }
        ]
      },
      {
        id: 'crown',
        title: 'WINDING CROWN & PUSHERS',
        tag: 'TACTILE CONTROL',
        position: new THREE.Vector3(2.4, 0, 0.1),
        desc: 'Ergonomic fluted winding crown with laser-monogrammed emblem logo cap and dual responsive chronograph pushers.',
        specs: [
          { key: 'Seal System', val: 'Triple Hydrophobic O-Ring' },
          { key: 'Emblem Cap', val: 'Engraved Brand Monogram "A"' },
          { key: 'Pushers', val: 'Dual Spring-Assisted Column Wheel' }
        ]
      },
      {
        id: 'movement',
        title: 'EXHIBITION MOVEMENT',
        tag: 'MECHANICAL HEART',
        position: new THREE.Vector3(0, 0, -0.4),
        desc: 'Sapphire exhibition caseback revealing the 28,800 VPH automatic movement, skeletonized 18k gold oscillating rotor, and 28 synthetic rubies.',
        specs: [
          { key: 'Calibre', val: 'In-House Automatic Cal. 8000' },
          { key: 'Frequency', val: '28,800 VPH (4 Hz)' },
          { key: 'Power Reserve', val: '72 Hours Continuous' },
          { key: 'Jewels', val: '28 Synthetic Ruby Bearings' }
        ]
      }
    ];

    this.hotspotElements = [];
    this.isVisible = false;
    this.init();
  }

  init() {
    this.hotspotsData.forEach((data) => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker';
      el.innerHTML = `
        <div class="hotspot-dot-ring">
          <div class="hotspot-dot"></div>
          <div class="hotspot-pulse"></div>
        </div>
        <div class="hotspot-label">${data.title}</div>
      `;

      el.addEventListener('click', () => this.openModal(data));
      this.container.appendChild(el);

      this.hotspotElements.push({
        data: data,
        element: el
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    const backdrop = this.modal ? this.modal.querySelector('.modal-backdrop') : null;
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeModal());
    }
  }

  setVisible(visible) {
    this.isVisible = visible;
    this.hotspotElements.forEach((item) => {
      if (visible) {
        item.element.classList.add('is-visible');
      } else {
        item.element.classList.remove('is-visible');
      }
    });
  }

  update(camera, objectMatrixWorld) {
    if (!this.isVisible || !camera) {
      this.hotspotElements.forEach(item => {
        item.element.classList.remove('is-facing');
      });
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const worldPos = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    this.hotspotElements.forEach((item) => {
      worldPos.copy(item.data.position);
      if (objectMatrixWorld) {
        worldPos.applyMatrix4(objectMatrixWorld);
      }

      // Check surface normal facing direction to avoid showing backside hotspots
      normal.set(0, 0, item.data.position.z >= 0 ? 1 : -1);
      if (objectMatrixWorld) {
        normal.transformDirection(objectMatrixWorld);
      }
      camDir.subVectors(camera.position, worldPos).normalize();
      const dot = normal.dot(camDir);

      const proj = worldPos.clone().project(camera);

      // Occlude if facing away or outside clip space
      if (dot < 0.15 || proj.z < -1 || proj.z > 1) {
        item.element.classList.remove('is-facing');
        return;
      }

      const x = (proj.x * 0.5 + 0.5) * width;
      const y = (-proj.y * 0.5 + 0.5) * height;

      item.element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      item.element.classList.add('is-facing');
    });
  }

  openModal(data) {
    if (!this.modal) return;

    if (this.sound) this.sound.playChime();

    if (this.cameraController && typeof this.cameraController.focusOnHotspot === 'function') {
      this.cameraController.focusOnHotspot(data.position, new THREE.Vector3(0, 0, 0));
    }

    if (this.modalTitle) this.modalTitle.innerText = data.title;
    if (this.modalTag) this.modalTag.innerText = data.tag;
    if (this.modalDesc) this.modalDesc.innerText = data.desc;

    if (this.modalSpecs) {
      this.modalSpecs.innerHTML = data.specs.map(s => `
        <div class="tech-spec-row">
          <span class="tech-key">${s.key}</span>
          <span class="tech-val">${s.val}</span>
        </div>
      `).join('');
    }

    this.modal.classList.add('is-open');
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('is-open');
    }
  }
}
