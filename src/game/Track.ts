import * as THREE from 'three';
import { LANE_POSITIONS, LANE_WIDTH, LaneIndex, LevelThemeConfig } from './types';

const TRACK_LENGTH = 140;
const TRACK_START_Z = 16;
const TRACK_CENTER_Z = TRACK_START_Z - TRACK_LENGTH / 2; // -54
const PYLON_PAIRS_COUNT = 14;
const PYLON_SPACING = TRACK_LENGTH / PYLON_PAIRS_COUNT; // 10 units

// Pre-allocated math helpers to avoid GC in the render loop
const _dummyObj = new THREE.Object3D();
const _tempColor = new THREE.Color();

export function getLaneX(lane: LaneIndex): number {
  return LANE_POSITIONS[lane] ?? 0;
}

export class Track {
  public readonly group: THREE.Group;

  private groundMesh: THREE.Mesh;
  private deckBaseMesh: THREE.Mesh;
  private laneMeshes: THREE.Mesh[];
  private dividerMeshes: [THREE.Mesh, THREE.Mesh];
  private curbLeftMesh: THREE.Mesh;
  private curbRightMesh: THREE.Mesh;

  // Instanced roadside pylons (3-part composite silhouette: base, column, beacon)
  private pylonBaseInstanced: THREE.InstancedMesh;
  private pylonColumnInstanced: THREE.InstancedMesh;
  private pylonCapInstanced: THREE.InstancedMesh;
  private archInstanced: THREE.InstancedMesh;

  // Distant horizon skyline / terrain blocks so the world has natural depth
  private horizonGroup: THREE.Group;

  // Player anchor zone & active lane highlight pad (Z = 4.0)
  private laneMarkerGroup: THREE.Group;
  private activeLaneRing!: THREE.Mesh;
  private currentHighlightedLane: LaneIndex = 1;
  private markerCurrentX = 0;

  private laneTexture: THREE.CanvasTexture | null = null;
  private curbTexture: THREE.CanvasTexture | null = null;
  private scrollOffset = 0;
  private maxAnisotropy: number;

  constructor(initialTheme: LevelThemeConfig, maxAnisotropy = 4) {
    this.maxAnisotropy = maxAnisotropy;
    this.group = new THREE.Group();
    this.group.name = 'ThreeLaneTrack';

    this.laneTexture = this.createLaneChevronTexture();
    this.curbTexture = this.createCurbStripeTexture();

    // 1. Expansive outer ground plane extending to the horizon
    const groundGeo = new THREE.PlaneGeometry(260, TRACK_LENGTH + 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: initialTheme.groundColor,
      roughness: 0.92,
      metalness: 0.08,
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.set(0, -0.15, TRACK_CENTER_Z - 10);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    // 2. Main structural roadbed deck beneath the 3 lanes
    const totalTrackWidth = LANE_WIDTH * 3 + 0.9;
    const deckGeo = new THREE.BoxGeometry(totalTrackWidth, 0.24, TRACK_LENGTH);
    const deckMat = new THREE.MeshStandardMaterial({
      color: initialTheme.trackSurfaceColor,
      roughness: 0.7,
      metalness: 0.25,
    });
    this.deckBaseMesh = new THREE.Mesh(deckGeo, deckMat);
    this.deckBaseMesh.position.set(0, -0.12, TRACK_CENTER_Z);
    this.deckBaseMesh.receiveShadow = true;
    this.group.add(this.deckBaseMesh);

    // 3. Three distinct running lanes (Left: -2.4, Center: 0, Right: +2.4)
    const laneStripWidth = LANE_WIDTH - 0.16;
    const laneGeo = new THREE.PlaneGeometry(laneStripWidth, TRACK_LENGTH);

    this.laneMeshes = ([0, 1, 2] as const).map((idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: initialTheme.laneCenterColors[idx],
        map: this.laneTexture,
        roughness: 0.55,
        metalness: 0.2,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const mesh = new THREE.Mesh(laneGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(LANE_POSITIONS[idx], 0.02, TRACK_CENTER_Z);
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    });

    // 4. Luminous lane divider strips between Left|Center (-1.2) and Center|Right (+1.2)
    const dividerGeo = new THREE.PlaneGeometry(0.12, TRACK_LENGTH);
    const dividerMat = new THREE.MeshStandardMaterial({
      color: initialTheme.laneDividerColor,
      emissive: initialTheme.laneDividerColor,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const leftDivider = new THREE.Mesh(dividerGeo, dividerMat);
    leftDivider.rotation.x = -Math.PI / 2;
    leftDivider.position.set(-LANE_WIDTH / 2, 0.03, TRACK_CENTER_Z);

    const rightDivider = new THREE.Mesh(dividerGeo, dividerMat);
    rightDivider.rotation.x = -Math.PI / 2;
    rightDivider.position.set(LANE_WIDTH / 2, 0.03, TRACK_CENTER_Z);

    this.dividerMeshes = [leftDivider, rightDivider];
    this.group.add(leftDivider, rightDivider);

    // 5. Raised side curbs framing the 3-lane track
    const curbGeo = new THREE.BoxGeometry(0.38, 0.28, TRACK_LENGTH);
    const curbMat = new THREE.MeshStandardMaterial({
      color: initialTheme.curbColor,
      map: this.curbTexture,
      roughness: 0.4,
      metalness: 0.35,
    });
    const curbOffsetX = (LANE_WIDTH * 3) / 2 + 0.22; // 3.82
    this.curbLeftMesh = new THREE.Mesh(curbGeo, curbMat);
    this.curbLeftMesh.position.set(-curbOffsetX, 0.14, TRACK_CENTER_Z);
    this.curbLeftMesh.castShadow = true;
    this.curbLeftMesh.receiveShadow = true;

    this.curbRightMesh = new THREE.Mesh(curbGeo, curbMat);
    this.curbRightMesh.position.set(curbOffsetX, 0.14, TRACK_CENTER_Z);
    this.curbRightMesh.castShadow = true;
    this.curbRightMesh.receiveShadow = true;

    this.group.add(this.curbLeftMesh, this.curbRightMesh);

    // 6. Composite 3-part roadside pylons + overhead arches using InstancedMesh
    const totalPylons = PYLON_PAIRS_COUNT * 2;
    const baseGeo = new THREE.BoxGeometry(0.9, 0.5, 0.9);
    const baseMat = new THREE.MeshStandardMaterial({
      color: initialTheme.pylonPrimaryColor,
      roughness: 0.6,
      metalness: 0.4,
    });
    this.pylonBaseInstanced = new THREE.InstancedMesh(baseGeo, baseMat, totalPylons);
    this.pylonBaseInstanced.castShadow = true;
    this.pylonBaseInstanced.receiveShadow = true;
    this.pylonBaseInstanced.frustumCulled = false;

    const colGeo = new THREE.CylinderGeometry(0.22, 0.3, 3.2, 8);
    const colMat = new THREE.MeshStandardMaterial({
      color: initialTheme.pylonPrimaryColor,
      roughness: 0.35,
      metalness: 0.7,
    });
    this.pylonColumnInstanced = new THREE.InstancedMesh(colGeo, colMat, totalPylons);
    this.pylonColumnInstanced.castShadow = true;
    this.pylonColumnInstanced.receiveShadow = true;
    this.pylonColumnInstanced.frustumCulled = false;

    const capGeo = new THREE.OctahedronGeometry(0.36, 0);
    const capMat = new THREE.MeshStandardMaterial({
      color: initialTheme.pylonAccentColor,
      emissive: initialTheme.pylonAccentColor,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3,
    });
    this.pylonCapInstanced = new THREE.InstancedMesh(capGeo, capMat, totalPylons);
    this.pylonCapInstanced.frustumCulled = false;

    // Overhead horizon arches every 2nd pylon pair (7 arches)
    const archGeo = new THREE.TorusGeometry(4.9, 0.12, 8, 28, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({
      color: initialTheme.pylonAccentColor,
      emissive: initialTheme.pylonAccentColor,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.75,
    });
    this.archInstanced = new THREE.InstancedMesh(
      archGeo,
      archMat,
      Math.floor(PYLON_PAIRS_COUNT / 2),
    );
    this.archInstanced.frustumCulled = false;

    this.group.add(
      this.pylonBaseInstanced,
      this.pylonColumnInstanced,
      this.pylonCapInstanced,
      this.archInstanced,
    );

    // 7. Distant Horizon Skyline / Natural Outer Silhouette
    this.horizonGroup = this.createHorizonScenery(initialTheme);
    this.group.add(this.horizonGroup);

    // 8. Player Anchor Zone & Active Lane Marker at Z = 4.0
    this.laneMarkerGroup = this.createLaneMarkerGroup(initialTheme);
    this.group.add(this.laneMarkerGroup);

    this.updatePylonMatrices();
  }

  private createLaneChevronTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base neutral mid-tone so material color multiplies cleanly
    ctx.fillStyle = '#d8e4f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle tile seam lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.lineWidth = 4;
    for (let y = 0; y < canvas.height; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Side edge trim lines inside each lane
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 0, canvas.width - 28, canvas.height);

    // Forward chevron arrows pointing toward -Z
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawChevron = (centerY: number) => {
      ctx.beginPath();
      ctx.moveTo(68, centerY + 26);
      ctx.lineTo(128, centerY - 22);
      ctx.lineTo(188, centerY + 26);
      ctx.stroke();
    };

    drawChevron(128);
    drawChevron(384);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, TRACK_LENGTH / 6);
    texture.anisotropy = this.maxAnisotropy;
    return texture;
  }

  private createCurbStripeTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 128);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 128, 64, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, TRACK_LENGTH / 4);
    texture.anisotropy = this.maxAnisotropy;
    return texture;
  }

  private createHorizonScenery(theme: LevelThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const spireMat = new THREE.MeshStandardMaterial({
      color: theme.pylonPrimaryColor,
      roughness: 0.75,
      metalness: 0.3,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: theme.pylonAccentColor,
      emissive: theme.pylonAccentColor,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });

    // Place silhouette structures along left and right outer flanks and far horizon
    const placements = [
      { x: -16, z: -25, w: 4.5, h: 11, d: 4.5 },
      { x: -22, z: -55, w: 6.0, h: 16, d: 6.0 },
      { x: -18, z: -85, w: 5.0, h: 13, d: 5.0 },
      { x: 16, z: -30, w: 4.5, h: 12, d: 4.5 },
      { x: 23, z: -60, w: 6.5, h: 18, d: 6.0 },
      { x: 18, z: -90, w: 5.0, h: 14, d: 5.0 },
      { x: -12, z: -118, w: 7.0, h: 20, d: 6.0 },
      { x: 12, z: -118, w: 7.0, h: 20, d: 6.0 },
    ];

    placements.forEach((p) => {
      const tower = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(p.w, p.h, p.d);
      const body = new THREE.Mesh(bodyGeo, spireMat);
      body.position.y = p.h / 2 - 0.15;

      const crownGeo = new THREE.BoxGeometry(p.w * 0.65, 1.2, p.d * 0.65);
      const crown = new THREE.Mesh(crownGeo, windowMat);
      crown.position.y = p.h + 0.45;

      tower.add(body, crown);
      tower.position.set(p.x, 0, p.z);
      group.add(tower);
    });

    return group;
  }

  private createLaneMarkerGroup(theme: LevelThemeConfig): THREE.Group {
    const group = new THREE.Group();
    const anchorZ = 4.0;

    // Subtle pads on all 3 lanes at the player Z line so all 3 lanes are clearly anchored
    const padGeo = new THREE.RingGeometry(0.55, 0.78, 24);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });

    LANE_POSITIONS.forEach((x) => {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(x, 0.04, anchorZ);
      group.add(pad);
    });

    // Highlighted active lane beacon ring
    const activeGeo = new THREE.RingGeometry(0.65, 0.96, 32);
    const activeMat = new THREE.MeshStandardMaterial({
      color: theme.curbColor,
      emissive: theme.curbColor,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    this.activeLaneRing = new THREE.Mesh(activeGeo, activeMat);
    this.activeLaneRing.rotation.x = -Math.PI / 2;
    this.activeLaneRing.position.set(0, 0.05, anchorZ);
    group.add(this.activeLaneRing);

    return group;
  }

  private updatePylonMatrices(): void {
    const sideOffsetX = (LANE_WIDTH * 3) / 2 + 1.15; // 4.75
    let instanceIdx = 0;
    let archIdx = 0;

    for (let i = 0; i < PYLON_PAIRS_COUNT; i++) {
      // Modular Z position that wraps smoothly from -124 to +16
      const rawZ = TRACK_START_Z - i * PYLON_SPACING + (this.scrollOffset % PYLON_SPACING);
      const z = rawZ > TRACK_START_Z ? rawZ - TRACK_LENGTH : rawZ;

      for (const side of [-1, 1]) {
        const x = side * sideOffsetX;

        // 1. Base pedestal (grounded at y = 0.25)
        _dummyObj.position.set(x, 0.25, z);
        _dummyObj.rotation.set(0, 0, 0);
        _dummyObj.scale.set(1, 1, 1);
        _dummyObj.updateMatrix();
        this.pylonBaseInstanced.setMatrixAt(instanceIdx, _dummyObj.matrix);

        // 2. Column shaft
        _dummyObj.position.set(x, 2.1, z);
        _dummyObj.updateMatrix();
        this.pylonColumnInstanced.setMatrixAt(instanceIdx, _dummyObj.matrix);

        // 3. Glowing energy crystal cap
        _dummyObj.position.set(x, 4.05, z);
        _dummyObj.rotation.set(0, this.scrollOffset * 0.15 + i, 0);
        _dummyObj.updateMatrix();
        this.pylonCapInstanced.setMatrixAt(instanceIdx, _dummyObj.matrix);

        instanceIdx++;
      }

      if (i % 2 === 0 && archIdx < this.archInstanced.count) {
        _dummyObj.position.set(0, 1.8, z);
        _dummyObj.rotation.set(0, 0, 0);
        _dummyObj.scale.set(1, 1, 1);
        _dummyObj.updateMatrix();
        this.archInstanced.setMatrixAt(archIdx, _dummyObj.matrix);
        archIdx++;
      }
    }

    this.pylonBaseInstanced.instanceMatrix.needsUpdate = true;
    this.pylonColumnInstanced.instanceMatrix.needsUpdate = true;
    this.pylonCapInstanced.instanceMatrix.needsUpdate = true;
    this.archInstanced.instanceMatrix.needsUpdate = true;
  }

  public setHighlightedLane(lane: LaneIndex): void {
    this.currentHighlightedLane = lane;
  }

  public getHighlightedLane(): LaneIndex {
    return this.currentHighlightedLane;
  }

  public applyTheme(theme: LevelThemeConfig): void {
    (this.groundMesh.material as THREE.MeshStandardMaterial).color.setHex(theme.groundColor);
    (this.deckBaseMesh.material as THREE.MeshStandardMaterial).color.setHex(
      theme.trackSurfaceColor,
    );

    this.laneMeshes.forEach((mesh, idx) => {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(theme.laneCenterColors[idx]);
    });

    this.dividerMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(theme.laneDividerColor);
      mat.emissive.setHex(theme.laneDividerColor);
    });

    const curbMat = this.curbLeftMesh.material as THREE.MeshStandardMaterial;
    curbMat.color.setHex(theme.curbColor);

    (this.pylonBaseInstanced.material as THREE.MeshStandardMaterial).color.setHex(
      theme.pylonPrimaryColor,
    );
    (this.pylonColumnInstanced.material as THREE.MeshStandardMaterial).color.setHex(
      theme.pylonPrimaryColor,
    );

    const capMat = this.pylonCapInstanced.material as THREE.MeshStandardMaterial;
    capMat.color.setHex(theme.pylonAccentColor);
    capMat.emissive.setHex(theme.pylonAccentColor);

    const archMat = this.archInstanced.material as THREE.MeshStandardMaterial;
    archMat.color.setHex(theme.pylonAccentColor);
    archMat.emissive.setHex(theme.pylonAccentColor);

    const ringMat = this.activeLaneRing.material as THREE.MeshStandardMaterial;
    ringMat.color.setHex(theme.curbColor);
    ringMat.emissive.setHex(theme.curbColor);

    this.horizonGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity > 0.1) {
          _tempColor.setHex(theme.pylonAccentColor);
          mat.color.copy(_tempColor);
          mat.emissive.copy(_tempColor);
        } else {
          mat.color.setHex(theme.pylonPrimaryColor);
        }
      }
    });
  }

  public update(delta: number, speed: number): void {
    const safeDelta = Math.min(Math.max(delta, 0), 0.1);

    if (speed > 0) {
      this.scrollOffset += safeDelta * speed;

      if (this.laneTexture) {
        this.laneTexture.offset.y = -(this.scrollOffset / 6) % 1;
      }
      if (this.curbTexture) {
        this.curbTexture.offset.y = -(this.scrollOffset / 4) % 1;
      }

      this.updatePylonMatrices();
    }

    // Smoothly damp the active lane beacon X position
    const targetX = getLaneX(this.currentHighlightedLane);
    this.markerCurrentX = THREE.MathUtils.damp(this.markerCurrentX, targetX, 12, safeDelta);
    this.activeLaneRing.position.x = this.markerCurrentX;
  }

  public dispose(): void {
    this.laneTexture?.dispose();
    this.curbTexture?.dispose();

    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  }
}
