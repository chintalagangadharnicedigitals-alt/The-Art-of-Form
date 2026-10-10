import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class AssetManager {
  constructor(onProgress) {
    this.onProgress = onProgress;

    // Central THREE.LoadingManager for asset tracking
    this.loadingManager = new THREE.LoadingManager(
      () => {
        if (typeof this.onProgress === 'function') this.onProgress(100);
      },
      (itemUrl, itemsLoaded, itemsTotal) => {
        const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
        if (typeof this.onProgress === 'function') this.onProgress(percent);
      },
      (url) => {
        console.warn(`[AssetManager] Asset loading warning for ${url}`);
      }
    );

    this.loader = new GLTFLoader(this.loadingManager);
    this.dracoLoader = new DRACOLoader(this.loadingManager);
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader.setDRACOLoader(this.dracoLoader);

    this.rgbeLoader = new RGBELoader(this.loadingManager);
  }

  loadModel(url) {
    return new Promise((resolve) => {
      if (typeof this.onProgress === 'function') {
        this.onProgress(50);
      }
      // Create master luxury 3D Chronograph Watch model
      const model = this.createProceduralSculpture();
      if (typeof this.onProgress === 'function') {
        this.onProgress(100);
      }
      resolve(model);
    });
  }

  loadEnvironment(renderer) {
    return new Promise((resolve) => {
      this.rgbeLoader.load(
        '/assets/hdr/studio.hdr',
        (texture) => {
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          pmremGenerator.compileEquirectangularShader();
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          texture.dispose();
          pmremGenerator.dispose();
          resolve(envMap);
        },
        undefined,
        () => {
          // Generate realistic 4-softbox studio HDR environment map
          resolve(this.createProceduralStudioHDR(renderer));
        }
      );
    });
  }

  /**
   * Generates a high-contrast 4-softbox studio environment map using PMREMGenerator
   */
  createProceduralStudioHDR(renderer) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const virtualScene = new THREE.Scene();
    virtualScene.background = new THREE.Color(0x0a0f0d);

    // 1. Crisp Clean Studio Key Softbox
    const light1 = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xeaf4ee })
    );
    light1.position.set(12, 14, 12);
    virtualScene.add(light1);

    // 2. Sage Rim Softbox
    const light2 = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x9fb8aa })
    );
    light2.position.set(-12, -8, -10);
    virtualScene.add(light2);

    // 3. Top Studio Overhead Specular Strip
    const light3 = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.5, 5),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    light3.position.set(0, 16, 0);
    virtualScene.add(light3);

    // 4. Ambient Specular Reflection Ring (Sage)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(9, 0.8, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x7da38d })
    );
    ring.rotation.x = Math.PI / 3;
    virtualScene.add(ring);

    const envMap = pmremGenerator.fromScene(virtualScene).texture;
    pmremGenerator.dispose();

    return envMap;
  }

  /**
   * Helper: Generate Ultra-HD 2048x2048 Dial Face Texture with Photorealistic Sub-dials & Branding
   */
  createDialCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // 1. Deep Matte Black Background with subtle radial sunburst gradient
    const grad = ctx.createRadialGradient(1024, 1024, 100, 1024, 1024, 1020);
    grad.addColorStop(0, '#1a1d26');
    grad.addColorStop(0.5, '#0e1017');
    grad.addColorStop(0.85, '#07080b');
    grad.addColorStop(1, '#030304');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 2048);

    // 2. Intricate Radial Guilloche Sunburst Micro Lines (concentric rings & radial spokes)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.06)';
    ctx.lineWidth = 1.5;
    for (let r = 160; r < 980; r += 6) {
      ctx.beginPath();
      ctx.arc(1024, 1024, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.035)';
    ctx.lineWidth = 1;
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(1024 + Math.cos(rad) * 200, 1024 + Math.sin(rad) * 200);
      ctx.lineTo(1024 + Math.cos(rad) * 960, 1024 + Math.sin(rad) * 960);
      ctx.stroke();
    }

    // 3. Outer Tachymeter Scale Ring
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(1024, 1024, 960, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(243, 229, 171, 0.85)';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tachLabels = ['TACHYMETER', '400', '300', '240', '200', '160', '120', '100', '80', '60'];
    tachLabels.forEach((label, idx) => {
      const angle = (idx / tachLabels.length) * Math.PI * 1.8 - Math.PI * 0.9;
      const tx = 1024 + Math.cos(angle) * 935;
      const ty = 1024 + Math.sin(angle) * 935;
      ctx.fillText(label, tx, ty);
    });

    // 4. Minute Track with 1/5th Second Ticks
    for (let i = 0; i < 300; i++) {
      const angle = (i / 300) * Math.PI * 2;
      const isMajor = i % 25 === 0;
      const isMedium = i % 5 === 0;

      const r1 = 900;
      const r2 = isMajor ? 850 : isMedium ? 870 : 885;

      const x1 = 1024 + Math.cos(angle) * r1;
      const y1 = 1024 + Math.sin(angle) * r1;
      const x2 = 1024 + Math.cos(angle) * r2;
      const y2 = 1024 + Math.sin(angle) * r2;

      ctx.strokeStyle = isMajor ? 'rgba(243, 229, 171, 0.95)' : isMedium ? 'rgba(212, 175, 55, 0.65)' : 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = isMajor ? 5 : isMedium ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 5. Draw 3 Photorealistic Chronograph Sub-dials (3 o'clock, 6 o'clock, 9 o'clock)
    const drawSubDial = (cx, cy, radius, labelText, numbers) => {
      const sGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      sGrad.addColorStop(0, '#090a0e');
      sGrad.addColorStop(0.85, '#12141c');
      sGrad.addColorStop(1, '#1e222e');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Subdial concentric azurage grooves
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.lineWidth = 1.5;
      for (let r = 20; r < radius; r += 10) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Outer gold border ring
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Subdial numerals & tick marks
      numbers.forEach((num, idx) => {
        const sAngle = (idx / numbers.length) * Math.PI * 2 - Math.PI / 2;
        const nx = cx + Math.cos(sAngle) * (radius - 40);
        const ny = cy + Math.sin(sAngle) * (radius - 40);

        ctx.fillStyle = '#f3e5ab';
        ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num, nx, ny);

        const tx1 = cx + Math.cos(sAngle) * radius;
        const ty1 = cy + Math.sin(sAngle) * radius;
        const tx2 = cx + Math.cos(sAngle) * (radius - 16);
        const ty2 = cy + Math.sin(sAngle) * (radius - 16);

        ctx.strokeStyle = 'rgba(243, 229, 171, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
      });

      // Subdial Label text
      ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, cx, cy + radius * 0.52);
    };

    drawSubDial(1360, 1024, 230, '30 MIN', ['30', '10', '20']); // 3 o'clock
    drawSubDial(1024, 1360, 230, '60 SEC', ['60', '20', '40']); // 6 o'clock
    drawSubDial(688, 1024, 230, '12 HR', ['12', '4', '8']);     // 9 o'clock

    // 6. Gold Leaf Brand Emblem & Typography
    ctx.fillStyle = '#f3e5ab';
    ctx.font = '300 64px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈', 1024, 560);

    ctx.font = '500 52px "Cormorant Garamond", Georgia, serif';
    ctx.letterSpacing = '0.25em';
    ctx.fillText('THE ART OF FORM', 1024, 640);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CHRONOGRAPH AUTOMATIC', 1024, 695);

    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SWISS MADE', 1024, 1780);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Helper: Generate Photorealistic Alligator Leather Bump & Texture Map
   */
  createLeatherTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep rich dark leather base
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, 1024, 1024);

    // Crocodile/Alligator Scale Tile Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    for (let x = 40; x < 1024; x += 120) {
      for (let y = 40; y < 1024; y += 140) {
        const w = 100 + (Math.sin(x * y) * 20);
        const h = 120 + (Math.cos(x + y) * 20);
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 18);
        ctx.stroke();

        ctx.fillStyle = 'rgba(20, 24, 32, 0.3)';
        ctx.fill();
      }
    }

    // Gold Edge Stitching Lines
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(35, 20);
    ctx.lineTo(35, 1004);
    ctx.moveTo(989, 20);
    ctx.lineTo(989, 1004);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Helper: Generate Crown Cap Logo Texture ("A")
   */
  createCrownCapTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#dfb746';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#1d212a';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.arc(256, 256, 220, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1d212a';
    ctx.font = 'bold 260px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 256, 268);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Helper: Generate Exhibition Rotor Engraving Canvas Texture
   */
  createRotorCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Metallic gold base background
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 0, 1024, 1024);

    // Engraved circular Geneva stripes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 6;
    for (let r = 80; r < 500; r += 16) {
      ctx.beginPath();
      ctx.arc(512, 512, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Engraved Logo Text
    ctx.fillStyle = '#15171e';
    ctx.font = 'bold 60px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈ THE ART OF FORM ◈', 512, 340);

    ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('28 JEWELS • SWISS MADE', 512, 420);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates a Masterpiece 3D Luxury Chronograph Wristwatch ("THE ART OF FORM CHRONOGRAPH")
   */
  createProceduralSculpture() {
    const group = new THREE.Group();
    group.name = 'LuxuryChronographWatch';

    // -------------------------------------------------------------------------
    // 1. DYNAMIC PBR MATERIALS SYSTEM (Gold, Black, Silver)
    // -------------------------------------------------------------------------
    
    // Gold Primary Materials
    const goldCaseMat = new THREE.MeshPhysicalMaterial({
      color: 0xdfb746,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 1.4
    });

    const roseGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xcc8550,
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.9,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.4
    });

    const darkTitaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0x181a20,
      metalness: 0.92,
      roughness: 0.25,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.2
    });

    const sapphireGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.98,
      opacity: 1.0,
      transparent: true,
      roughness: 0.01,
      ior: 1.77,
      thickness: 0.6,
      reflectivity: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      envMapIntensity: 1.2
    });

    const bluedSteelMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a3d75,
      metalness: 0.94,
      roughness: 0.08,
      clearcoat: 1.0,
      envMapIntensity: 1.3
    });

    const rubyJewelMat = new THREE.MeshPhysicalMaterial({
      color: 0xc40c2b,
      transmission: 0.85,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.5
    });

    const leatherTex = this.createLeatherTexture();
    const leatherStrapMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      bumpMap: leatherTex,
      bumpScale: 0.05,
      color: 0x12141c,
      roughness: 0.6,
      metalness: 0.15
    });

    // -------------------------------------------------------------------------
    // 2. MAIN WATCH CASE & LUGS
    // -------------------------------------------------------------------------
    const caseRadius = 2.2;
    const caseThickness = 0.65;

    // Main Case Outer Shell
    const caseGeo = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 64);
    const caseMesh = new THREE.Mesh(caseGeo, goldCaseMat);
    caseMesh.rotation.x = Math.PI / 2;
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    group.add(caseMesh);

    // Bezel Ring (Chamfered specular rim)
    const bezelGeo = new THREE.TorusGeometry(caseRadius - 0.08, 0.14, 16, 64);
    const bezelMesh = new THREE.Mesh(bezelGeo, goldCaseMat);
    bezelMesh.position.z = caseThickness / 2 + 0.05;
    bezelMesh.castShadow = true;
    group.add(bezelMesh);

    // 4 Ergonomic Curved Lugs (Top & Bottom pair)
    const lugGroup = new THREE.Group();
    const lugPositions = [
      { x: -1.3, y: 2.1, angle: 0.2 },
      { x: 1.3, y: 2.1, angle: -0.2 },
      { x: -1.3, y: -2.1, angle: -0.2 },
      { x: 1.3, y: -2.1, angle: 0.2 }
    ];

    lugPositions.forEach(pos => {
      const lugGeo = new THREE.BoxGeometry(0.35, 0.9, 0.45);
      const lugMesh = new THREE.Mesh(lugGeo, goldCaseMat);
      lugMesh.position.set(pos.x, pos.y, 0);
      lugMesh.rotation.z = pos.angle;
      lugMesh.castShadow = true;
      lugGroup.add(lugMesh);
    });
    group.add(lugGroup);

    // -------------------------------------------------------------------------
    // 3. CURVED LUXURY LEATHER STRAP (Ergonomic wrist curvature)
    // -------------------------------------------------------------------------
    const strapGroup = new THREE.Group();

    // Build curved strap sections that arc naturally backwards around the wrist
    const createCurvedStrap = (isUpper) => {
      const subGroup = new THREE.Group();
      const segments = [
        { y: 2.45, z: -0.05, rx: -0.12, len: 0.85 },
        { y: 3.25, z: -0.25, rx: -0.32, len: 0.95 },
        { y: 4.05, z: -0.65, rx: -0.55, len: 1.05 },
        { y: 4.85, z: -1.25, rx: -0.80, len: 1.15 }
      ];

      segments.forEach(seg => {
        const geo = new THREE.BoxGeometry(1.8, seg.len, 0.26);
        const mesh = new THREE.Mesh(geo, leatherStrapMat);
        const yPos = isUpper ? seg.y : -seg.y;
        const zPos = seg.z;
        const rotX = isUpper ? seg.rx : -seg.rx;
        mesh.position.set(0, yPos, zPos);
        mesh.rotation.x = rotX;
        mesh.castShadow = true;
        subGroup.add(mesh);
      });

      return subGroup;
    };

    strapGroup.add(createCurvedStrap(true));
    strapGroup.add(createCurvedStrap(false));

    // Gold Strap Keeper Pins & Buckle Accents
    const keeperGeo = new THREE.BoxGeometry(1.9, 0.25, 0.35);
    const keeperMesh = new THREE.Mesh(keeperGeo, goldCaseMat);
    keeperMesh.position.set(0, 4.4, -0.9);
    keeperMesh.rotation.x = -0.65;
    strapGroup.add(keeperMesh);

    group.add(strapGroup);

    // -------------------------------------------------------------------------
    // 4. DIAL FACE & SAPPHIRE CRYSTAL
    // -------------------------------------------------------------------------
    const dialTex = this.createDialCanvasTexture();

    // Dial Base Disc
    const dialGeo = new THREE.CylinderGeometry(caseRadius - 0.22, caseRadius - 0.22, 0.06, 64);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.25,
      metalness: 0.2,
      envMapIntensity: 1.2
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.rotation.x = Math.PI / 2;
    dialMesh.position.z = caseThickness / 2 - 0.05;
    group.add(dialMesh);

    // Sapphire Crystal Glass Dome
    const glassGeo = new THREE.CylinderGeometry(caseRadius - 0.05, caseRadius - 0.05, 0.12, 64);
    const glassMesh = new THREE.Mesh(glassGeo, sapphireGlassMat);
    glassMesh.rotation.x = Math.PI / 2;
    glassMesh.position.z = caseThickness / 2 + 0.18;
    group.add(glassMesh);

    // -------------------------------------------------------------------------
    // 5. HOUR INDICES & PRECISION HANDS (Accurate Centered Arbors)
    // -------------------------------------------------------------------------
    
    // 12 Applied Gold Hour Markers
    const indicesGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = caseRadius - 0.45;
      const isMajor = i % 3 === 0;
      
      const indexGeo = new THREE.BoxGeometry(
        isMajor ? 0.12 : 0.07,
        isMajor ? 0.36 : 0.24,
        0.08
      );
      const indexMesh = new THREE.Mesh(indexGeo, roseGoldMat);
      indexMesh.position.x = Math.cos(angle) * radius;
      indexMesh.position.y = Math.sin(angle) * radius;
      indexMesh.position.z = caseThickness / 2 + 0.05;
      indexMesh.rotation.z = angle + Math.PI / 2;
      indexMesh.castShadow = true;
      indicesGroup.add(indexMesh);
    }
    group.add(indicesGroup);

    // Clock Hands Stack (Pivots centered strictly at 0, 0, 0 arbor)
    const handsGroup = new THREE.Group();
    handsGroup.name = 'HandsGroup';
    handsGroup.position.z = caseThickness / 2 + 0.08;

    // 1. Hour Hand (Faceted Gold Sword with base at 0, pointing out to hour markers)
    const hourHandPivot = new THREE.Group();
    hourHandPivot.position.set(0, 0, 0.01);
    const hourHandGeo = new THREE.ConeGeometry(0.08, 1.1, 4);
    hourHandGeo.translate(0, 0.55, 0); // Origin at arbor pivot
    const hourHandMesh = new THREE.Mesh(hourHandGeo, roseGoldMat);
    hourHandMesh.castShadow = true;
    hourHandPivot.add(hourHandMesh);
    handsGroup.add(hourHandPivot);

    // 2. Minute Hand (Faceted Gold Sword reaching out to minute track)
    const minHandPivot = new THREE.Group();
    minHandPivot.position.set(0, 0, 0.03);
    const minHandGeo = new THREE.ConeGeometry(0.065, 1.5, 4);
    minHandGeo.translate(0, 0.75, 0); // Origin at arbor pivot
    const minHandMesh = new THREE.Mesh(minHandGeo, roseGoldMat);
    minHandMesh.castShadow = true;
    minHandPivot.add(minHandMesh);
    handsGroup.add(minHandPivot);

    // 3. Central Chronograph Second Hand (Sweeping needle + counterweight)
    const secHandPivot = new THREE.Group();
    secHandPivot.position.set(0, 0, 0.05);
    const secHandGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.9, 8);
    secHandGeo.translate(0, 0.7, 0); // Origin at arbor pivot
    const secHandMesh = new THREE.Mesh(secHandGeo, bluedSteelMat);
    secHandPivot.add(secHandMesh);

    // Counterweight at tail of second hand
    const counterGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    const counterMesh = new THREE.Mesh(counterGeo, bluedSteelMat);
    counterMesh.position.y = -0.25;
    counterMesh.rotation.x = Math.PI / 2;
    secHandPivot.add(counterMesh);
    handsGroup.add(secHandPivot);

    // Hand Center Arbor Cap Pin
    const capPinGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16);
    const capPinMesh = new THREE.Mesh(capPinGeo, roseGoldMat);
    capPinMesh.rotation.x = Math.PI / 2;
    capPinMesh.position.z = 0.06;
    handsGroup.add(capPinMesh);

    group.add(handsGroup);

    // 3D Subdial Hands Stack (3 o'clock, 6 o'clock, 9 o'clock)
    const subHandsGroup = new THREE.Group();
    subHandsGroup.name = 'SubHandsGroup';

    // 3 o'clock Subdial Hand (30 MIN)
    const subHand3Pivot = new THREE.Group();
    subHand3Pivot.position.set(0.72, 0, caseThickness / 2 + 0.07);
    const subHand3Geo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8);
    subHand3Geo.translate(0, 0.14, 0);
    const subHand3Mesh = new THREE.Mesh(subHand3Geo, bluedSteelMat);
    subHand3Pivot.add(subHand3Mesh);
    const subPin3 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), roseGoldMat);
    subPin3.rotation.x = Math.PI / 2;
    subHand3Pivot.add(subPin3);
    subHandsGroup.add(subHand3Pivot);

    // 6 o'clock Subdial Hand (60 SEC Running Seconds)
    const subHand6Pivot = new THREE.Group();
    subHand6Pivot.position.set(0, -0.72, caseThickness / 2 + 0.07);
    const subHand6Geo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8);
    subHand6Geo.translate(0, 0.14, 0);
    const subHand6Mesh = new THREE.Mesh(subHand6Geo, roseGoldMat);
    subHand6Pivot.add(subHand6Mesh);
    const subPin6 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), roseGoldMat);
    subPin6.rotation.x = Math.PI / 2;
    subHand6Pivot.add(subPin6);
    subHandsGroup.add(subHand6Pivot);

    // 9 o'clock Subdial Hand (12 HR)
    const subHand9Pivot = new THREE.Group();
    subHand9Pivot.position.set(-0.72, 0, caseThickness / 2 + 0.07);
    const subHand9Geo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8);
    subHand9Geo.translate(0, 0.14, 0);
    const subHand9Mesh = new THREE.Mesh(subHand9Geo, bluedSteelMat);
    subHand9Pivot.add(subHand9Mesh);
    const subPin9 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), roseGoldMat);
    subPin9.rotation.x = Math.PI / 2;
    subHand9Pivot.add(subPin9);
    subHandsGroup.add(subHand9Pivot);

    group.add(subHandsGroup);

    // -------------------------------------------------------------------------
    // 6. CROWN & CHRONOGRAPH PUSHERS (3 o'clock side)
    // -------------------------------------------------------------------------
    const crownGroup = new THREE.Group();
    crownGroup.name = 'CrownGroup';

    // Main Winding Crown with Fluted Grooves
    const crownStemGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
    const crownStemMesh = new THREE.Mesh(crownStemGeo, darkTitaniumMat);
    crownStemMesh.rotation.z = Math.PI / 2;
    crownStemMesh.position.x = caseRadius + 0.15;
    crownGroup.add(crownStemMesh);

    const crownCapGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 24);
    const crownCapTex = this.createCrownCapTexture();
    const crownCapMat = new THREE.MeshStandardMaterial({
      map: crownCapTex,
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 1.4
    });
    const crownCapMesh = new THREE.Mesh(crownCapGeo, crownCapMat);
    crownCapMesh.rotation.z = -Math.PI / 2;
    crownCapMesh.position.x = caseRadius + 0.32;
    crownGroup.add(crownCapMesh);

    // Chronograph Pusher Top (2 o'clock)
    const pusherTopGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.32, 16);
    const pusherTopMesh = new THREE.Mesh(pusherTopGeo, goldCaseMat);
    pusherTopMesh.position.set(caseRadius * Math.cos(Math.PI / 6) + 0.1, caseRadius * Math.sin(Math.PI / 6) + 0.1, 0);
    pusherTopMesh.rotation.z = Math.PI / 6;
    crownGroup.add(pusherTopMesh);

    // Chronograph Pusher Bottom (4 o'clock)
    const pusherBottomGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.32, 16);
    const pusherBottomMesh = new THREE.Mesh(pusherBottomGeo, goldCaseMat);
    pusherBottomMesh.position.set(caseRadius * Math.cos(-Math.PI / 6) + 0.1, caseRadius * Math.sin(-Math.PI / 6) - 0.1, 0);
    pusherBottomMesh.rotation.z = -Math.PI / 6;
    crownGroup.add(pusherBottomMesh);

    group.add(crownGroup);

    // -------------------------------------------------------------------------
    // 7. EXHIBITION CASEBACK & SKELETONIZED MECHANICAL MOVEMENT (Scene 05)
    // -------------------------------------------------------------------------
    const movementGroup = new THREE.Group();
    movementGroup.name = 'ExhibitionMovement';

    // 1. Movement Mainplate with circular perlage graining
    const mainplateGeo = new THREE.CylinderGeometry(caseRadius - 0.28, caseRadius - 0.28, 0.06, 32);
    const mainplateMat = new THREE.MeshStandardMaterial({
      color: 0x8e929f,
      metalness: 0.92,
      roughness: 0.25,
      envMapIntensity: 1.3
    });
    const mainplateMesh = new THREE.Mesh(mainplateGeo, mainplateMat);
    mainplateMesh.rotation.x = Math.PI / 2;
    mainplateMesh.position.z = -caseThickness / 2 + 0.02;
    movementGroup.add(mainplateMesh);

    // 2. Visible Gear Train & Ruby Bearings
    const gearTrainGroup = new THREE.Group();
    gearTrainGroup.position.z = -caseThickness / 2 - 0.01;
    const gearMeshes = [];

    const gearConfigs = [
      { r: 0.42, x: 0.65, y: 0.55 },
      { r: 0.35, x: -0.65, y: 0.65 },
      { r: 0.38, x: -0.55, y: -0.55 },
      { r: 0.32, x: 0.55, y: -0.65 }
    ];

    gearConfigs.forEach((cfg) => {
      const gearGeo = new THREE.CylinderGeometry(cfg.r, cfg.r, 0.03, 24);
      const gearMesh = new THREE.Mesh(gearGeo, roseGoldMat);
      gearMesh.rotation.x = Math.PI / 2;
      gearMesh.position.set(cfg.x, cfg.y, 0);
      gearTrainGroup.add(gearMesh);
      gearMeshes.push(gearMesh);

      // Synthetic Ruby jewel bearing at center
      const rubyGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const rubyMesh = new THREE.Mesh(rubyGeo, rubyJewelMat);
      rubyMesh.position.set(cfg.x, cfg.y, -0.02);
      gearTrainGroup.add(rubyMesh);
    });
    movementGroup.add(gearTrainGroup);

    // 3. Authentic 180-Degree Semi-Circular Gold Oscillating Rotor
    const rotorPivot = new THREE.Group();
    rotorPivot.position.set(0, 0, -caseThickness / 2 - 0.038);
    rotorPivot.name = 'OscillatingRotorPivot';

    const rotorTex = this.createRotorCanvasTexture();
    const rotorWeightGeo = new THREE.CylinderGeometry(
      caseRadius - 0.25,
      caseRadius - 0.25,
      0.03,
      48,
      1,
      false,
      -Math.PI / 2,
      Math.PI // 180-degree semi-circle weight
    );
    const rotorMat = new THREE.MeshStandardMaterial({
      map: rotorTex,
      color: 0xdfb746,
      metalness: 0.95,
      roughness: 0.18,
      side: THREE.DoubleSide,
      envMapIntensity: 1.4
    });
    const rotorWeightMesh = new THREE.Mesh(rotorWeightGeo, rotorMat);
    rotorWeightMesh.rotation.x = Math.PI / 2;
    rotorWeightMesh.castShadow = true;
    rotorPivot.add(rotorWeightMesh);

    // Central Rotor Arbor Cap & Bearing
    const rotorCenterGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24);
    const rotorCenterMesh = new THREE.Mesh(rotorCenterGeo, roseGoldMat);
    rotorCenterMesh.rotation.x = Math.PI / 2;
    rotorPivot.add(rotorCenterMesh);
    movementGroup.add(rotorPivot);

    // 4. Caseback Sapphire Window Ring & Exhibition Glass
    const casebackRingGeo = new THREE.TorusGeometry(caseRadius - 0.18, 0.12, 16, 64);
    const casebackRingMesh = new THREE.Mesh(casebackRingGeo, goldCaseMat);
    casebackRingMesh.position.z = -caseThickness / 2 - 0.06;
    movementGroup.add(casebackRingMesh);

    const casebackGlassGeo = new THREE.CylinderGeometry(caseRadius - 0.2, caseRadius - 0.2, 0.05, 32);
    const casebackGlassMesh = new THREE.Mesh(casebackGlassGeo, sapphireGlassMat);
    casebackGlassMesh.rotation.x = Math.PI / 2;
    casebackGlassMesh.position.z = -caseThickness / 2 - 0.08;
    movementGroup.add(casebackGlassMesh);

    group.add(movementGroup);

    // -------------------------------------------------------------------------
    // 8. DYNAMIC FINISH SWITCHER FUNCTIONALITY (Gold, Midnight Black, Classic Silver)
    // -------------------------------------------------------------------------
    const finishes = {
      gold: {
        caseColor: 0x7da38d,
        indicesColor: 0xd6e8de,
        rotorColor: 0x5a826c,
        dialColor: 0x16221c,
        metalness: 0.94,
        roughness: 0.16
      },
      sage: {
        caseColor: 0x7da38d,
        indicesColor: 0xd6e8de,
        rotorColor: 0x5a826c,
        dialColor: 0x16221c,
        metalness: 0.94,
        roughness: 0.16
      },
      black: {
        caseColor: 0x181a20,
        indicesColor: 0x9094a4,
        rotorColor: 0x222630,
        dialColor: 0xa0a4b0,
        metalness: 0.88,
        roughness: 0.32
      },
      silver: {
        caseColor: 0xd4d8e2,
        indicesColor: 0xf4f6fc,
        rotorColor: 0xd0d4de,
        dialColor: 0xffffff,
        metalness: 0.98,
        roughness: 0.12
      }
    };

    const setFinish = (finishName) => {
      const f = finishes[finishName] || finishes.gold;
      goldCaseMat.color.setHex(f.caseColor);
      goldCaseMat.metalness = f.metalness;
      goldCaseMat.roughness = f.roughness;
      goldCaseMat.needsUpdate = true;

      roseGoldMat.color.setHex(f.indicesColor);
      roseGoldMat.needsUpdate = true;

      rotorMat.color.setHex(f.rotorColor);
      rotorMat.needsUpdate = true;

      dialMat.color.setHex(f.dialColor);
      dialMat.needsUpdate = true;
    };

    // Store references in userData for kinetic animation and interactions
    group.userData = {
      caseMesh,
      bezelMesh,
      crownGroup,
      handsGroup,
      hourHand: hourHandPivot,
      minHand: minHandPivot,
      secHand: secHandPivot,
      subHand3: subHand3Pivot,
      subHand6: subHand6Pivot,
      subHand9: subHand9Pivot,
      rotorMesh: rotorPivot,
      gears: gearMeshes,
      gearTrainGroup,
      setFinish
    };

    return group;
  }
}

