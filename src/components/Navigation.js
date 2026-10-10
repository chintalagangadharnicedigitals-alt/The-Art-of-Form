export class Navigation {
  constructor(scrollController, soundComponent) {
    this.scrollController = scrollController;
    this.sound = soundComponent;
    
    this.navBtns = document.querySelectorAll('.nav-chapter-btn');
    this.sidebarItems = document.querySelectorAll('.sidebar-item');
    this.menuBtn = document.getElementById('menu-btn');
    this.menuOverlay = document.getElementById('menu-overlay');
    this.menuLinks = document.querySelectorAll('.menu-link');
    
    this.currChapterEl = document.getElementById('curr-chapter');
    this.currChapterNameEl = document.getElementById('curr-chapter-name');
    this.progressBarEl = document.getElementById('scroll-progress-bar');
    this.headerStageBadge = document.getElementById('header-stage-badge');

    this.finishBtns = document.querySelectorAll('.finish-btn');
    this.discoverBtns = document.querySelectorAll('.card-discover-btn');
    this.btn360 = document.getElementById('btn-360-inspect');
    this.btnReset = document.getElementById('btn-reset-view');
    this.sectionBtn360 = document.getElementById('section-btn-360');
    this.sectionBtnReset = document.getElementById('section-btn-reset');

    this.modal = document.getElementById('hotspot-modal');
    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.modalTitle = document.getElementById('modal-title');
    this.modalDesc = document.getElementById('modal-desc');
    this.modalTag = document.getElementById('modal-tag');
    
    this.stages = [
      { num: '01', name: 'REVEAL', sectionId: 'section-01' },
      { num: '02', name: 'ROTATION', sectionId: 'section-02' },
      { num: '03', name: 'DIAL', sectionId: 'section-03' },
      { num: '04', name: 'ENGINEERING', sectionId: 'section-04' },
      { num: '05', name: 'MOVEMENT', sectionId: 'section-05' },
      { num: '06', name: 'MATERIALS', sectionId: 'section-06' },
      { num: '07', name: 'PROFILE', sectionId: 'section-07' },
      { num: '08', name: 'LEGACY', sectionId: 'section-08' },
      { num: '09', name: 'COLLECTION', sectionId: 'section-09' }
    ];

    this.productDetails = {
      gold: {
        title: 'Heritage Sage Chronograph',
        tag: 'SAGE GREEN LUXURY EDITION',
        desc: 'Hand-crafted timepiece in bespoke anodized Sage Green finish with botanical guilloche dial, triple chronograph sub-dials, and alligator leather strap.'
      },
      black: {
        title: 'Midnight Black Chronograph',
        tag: 'DLC MATTE BLACK EDITION',
        desc: 'Diamond-Like Carbon (DLC) matte black titanium case with brushed dark dial and stealth luminescent markers.'
      },
      silver: {
        title: 'Classic Silver Chronograph',
        tag: 'GRADE-5 TITANIUM EDITION',
        desc: 'Ultra-lightweight Grade-5 Titanium case with mirror-polished chamfers, blued steel hands, and exhibition rotor.'
      }
    };

    this.isMenuOpen = false;
    this.init();
  }

  init() {
    // Nav Buttons Click (Top Header)
    this.navBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const chapterIdx = parseInt(btn.dataset.chapter, 10);
        if (this.sound) this.sound.playUIClick();
        this.scrollToStage(chapterIdx);
      });
    });

    // Sidebar Items Click (Right Vertical Sidebar)
    this.sidebarItems.forEach((item) => {
      item.addEventListener('click', () => {
        const chapterIdx = parseInt(item.dataset.chapter, 10);
        if (this.sound) this.sound.playUIClick();
        this.scrollToStage(chapterIdx);
      });
    });

    // Menu Toggle
    if (this.menuBtn) {
      this.menuBtn.addEventListener('click', () => {
        if (this.sound) this.sound.playUIClick();
        this.toggleMenu();
      });
    }

    // Menu Links
    this.menuLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const stageIdx = parseInt(link.dataset.goto, 10);
        if (this.sound) this.sound.playUIClick();
        this.toggleMenu(false);
        this.scrollToStage(stageIdx);
      });
    });

    // Buttons with data-scroll-to attribute
    document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.scrollTo;
        const targetSection = document.getElementById(targetId);
        if (this.sound) this.sound.playUIClick();
        if (targetSection && this.scrollController && this.scrollController.lenis) {
          this.scrollController.lenis.scrollTo(targetSection, { duration: 1.6 });
        }
      });
    });

    // 360-Degree Turntable Mode Toggle Button (Fixed bar & section 02 pills)
    const handle360Toggle = () => {
      if (this.sound) this.sound.playUIClick();
      if (this.scrollController && this.scrollController.sceneManager) {
        const active = this.scrollController.sceneManager.toggle360Inspect();
        if (this.btn360) this.btn360.classList.toggle('is-active', active);
        if (this.sectionBtn360) this.sectionBtn360.classList.toggle('is-active', active);
      }
    };

    if (this.btn360) this.btn360.addEventListener('click', handle360Toggle);
    if (this.sectionBtn360) this.sectionBtn360.addEventListener('click', handle360Toggle);

    // Reset View Button (Fixed bar & section 02 pills)
    const handleReset = () => {
      if (this.sound) this.sound.playUIClick();
      if (this.scrollController && this.scrollController.sceneManager) {
        this.scrollController.sceneManager.resetView();
        if (this.btn360) this.btn360.classList.remove('is-active');
        if (this.sectionBtn360) this.sectionBtn360.classList.remove('is-active');
      }
    };

    if (this.btnReset) this.btnReset.addEventListener('click', handleReset);
    if (this.sectionBtnReset) this.sectionBtnReset.addEventListener('click', handleReset);

    // Material Finish Switcher Buttons (Gold, Black, Silver)
    this.finishBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const finish = btn.dataset.finish;
        this.finishBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (this.sound) this.sound.playMaterialChime(finish);

        if (this.scrollController && this.scrollController.sceneManager) {
          this.scrollController.sceneManager.setFinish(finish);
        }
      });
    });

    // Product Card DISCOVER Buttons
    this.discoverBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const prodKey = btn.dataset.product || 'gold';
        if (this.sound) this.sound.playUIClick();
        this.openProductModal(prodKey);
      });
    });

    // Modal Close
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => {
        if (this.sound) this.sound.playUIClick();
        this.closeModal();
      });
    }
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
          if (this.sound) this.sound.playUIClick();
          this.closeModal();
        }
      });
    }

    const inquireBtn = document.getElementById('inquiry-btn');
    if (inquireBtn) {
      inquireBtn.addEventListener('click', () => {
        if (this.sound) this.sound.playUIClick();
        alert('Thank you for your interest in THE ART OF FORM. A horological specialist will contact you shortly.');
        this.closeModal();
      });
    }
  }

  openProductModal(prodKey) {
    const details = this.productDetails[prodKey] || this.productDetails.gold;
    if (this.modalTitle) this.modalTitle.innerText = details.title;
    if (this.modalTag) this.modalTag.innerText = details.tag;
    if (this.modalDesc) this.modalDesc.innerText = details.desc;

    if (this.modal) {
      this.modal.classList.add('is-open');
    }

    if (this.scrollController && this.scrollController.sceneManager) {
      this.scrollController.sceneManager.setFinish(prodKey);
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('is-open');
    }
  }

  toggleMenu(forceState) {
    this.isMenuOpen = forceState !== undefined ? forceState : !this.isMenuOpen;
    if (this.menuOverlay) {
      if (this.isMenuOpen) {
        this.menuOverlay.classList.add('is-active');
        if (this.menuBtn) this.menuBtn.classList.add('is-active');
      } else {
        this.menuOverlay.classList.remove('is-active');
        if (this.menuBtn) this.menuBtn.classList.remove('is-active');
      }
    }
  }

  scrollToStage(index) {
    const stage = this.stages[index] || this.stages[0];
    const section = document.getElementById(stage.sectionId);
    if (section && this.scrollController && this.scrollController.lenis) {
      this.scrollController.lenis.scrollTo(section, { duration: 1.6 });
    }
  }

  updateProgress(progress, activeStageIdx) {
    if (this.progressBarEl) {
      this.progressBarEl.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    }

    const stage = this.stages[activeStageIdx] || this.stages[0];

    if (this.headerStageBadge) {
      this.headerStageBadge.innerText = `${stage.num} — ${stage.name}`;
    }

    this.navBtns.forEach((btn) => {
      const btnStage = parseInt(btn.dataset.chapter, 10);
      if (btnStage === activeStageIdx) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.sidebarItems.forEach((item) => {
      const itemStage = parseInt(item.dataset.chapter, 10);
      if (itemStage === activeStageIdx) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (this.currChapterEl) this.currChapterEl.innerText = stage.num;
    if (this.currChapterNameEl) this.currChapterNameEl.innerText = stage.name;
  }
}
