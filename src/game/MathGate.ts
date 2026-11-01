import * as THREE from 'three';
import { createMultiplicationQuestion } from '../math/questionGenerator';
import { validateQuestion } from '../math/validators';
import { ROBOT_DEFAULT_Z } from './Robot';
import {
  LANE_LABELS,
  LANE_POSITIONS,
  LANE_WIDTH,
  LaneIndex,
  MultiplicationQuestion,
} from './types';

export const GATE_SPAWN_Z = -58;
export const GATE_DESPAWN_Z = 16;

export interface MathGateTriggerResult {
  questionId: string;
  question: MultiplicationQuestion;
  selectedLane: LaneIndex;
  selectedOption: number;
  correctOption: number;
  correctLane: LaneIndex;
  isCorrect: boolean;
  scoreDelta: number;
  livesDelta: number;
}

export class MathGate {
  public readonly group: THREE.Group;
  public readonly question: MultiplicationQuestion;

  private resolved = false;
  private previousZ: number;
  private maxAnisotropy: number;

  private questionBannerMesh!: THREE.Mesh;
  private portalFrames: THREE.Mesh[] = [];
  private optionSignMeshes: THREE.Mesh[] = [];
  private energyBarrierMeshes: THREE.Mesh[] = [];

  private generatedTextures: THREE.Texture[] = [];

  constructor(
    questionOrFactorA: MultiplicationQuestion | number = 7,
    factorB = 2,
    initialZ = GATE_SPAWN_Z,
    maxAnisotropy = 4,
  ) {
    this.maxAnisotropy = maxAnisotropy;

    if (typeof questionOrFactorA === 'number') {
      this.question = createMultiplicationQuestion(questionOrFactorA, factorB);
    } else {
      const check = validateQuestion(questionOrFactorA);
      if (check.valid) {
        this.question = questionOrFactorA;
      } else {
        this.question = createMultiplicationQuestion(
          questionOrFactorA.a || 2,
          questionOrFactorA.b || 3,
          questionOrFactorA.id,
        );
      }
    }

    this.previousZ = initialZ;
    this.group = new THREE.Group();
    this.group.name = 'MathGateGroup';
    this.group.position.set(0, 0, initialZ);

    this.buildGateStructure();
  }

  public getQuestionText(): string {
    return `${this.question.a} × ${this.question.b} = ?`;
  }

  public getOptions(): readonly [number, number, number] {
    return this.question.options;
  }

  public isResolved(): boolean {
    return this.resolved;
  }

  public getZ(): number {
    return this.group.position.z;
  }

  public setZ(z: number): void {
    this.previousZ = z;
    this.group.position.z = z;
  }

  private buildGateStructure(): void {
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.35,
      metalness: 0.65,
    });

    const yellowAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.25,
      metalness: 0.35,
    });

    const darkFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.7,
    });

    // 1. Four vertical support pillars separating the 3 lanes: x = [-3.6, -1.2, +1.2, +3.6]
    const pillarXPositions = [
      -LANE_WIDTH * 1.5,
      -LANE_WIDTH * 0.5,
      LANE_WIDTH * 0.5,
      LANE_WIDTH * 1.5,
    ];

    const baseGeo = new THREE.BoxGeometry(0.46, 0.36, 0.56);
    const columnGeo = new THREE.CylinderGeometry(0.14, 0.17, 3.8, 12);
    const capGeo = new THREE.BoxGeometry(0.38, 0.24, 0.44);

    pillarXPositions.forEach((xPos, idx) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.name = `GatePillar_${idx}`;
      pillarGroup.position.set(xPos, 0, 0);

      const baseMesh = new THREE.Mesh(baseGeo, yellowAccentMaterial);
      baseMesh.position.y = 0.18;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;

      const colMesh = new THREE.Mesh(columnGeo, pillarMaterial);
      colMesh.position.y = 2.08;
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;

      const capMesh = new THREE.Mesh(capGeo, yellowAccentMaterial);
      capMesh.position.y = 4.02;

      pillarGroup.add(baseMesh, colMesh, capMesh);
      this.group.add(pillarGroup);
    });

    // 2. Overhead Multiplication Question Banner Arch spanning all 3 lanes (y = 4.65)
    const bannerWidth = LANE_WIDTH * 3 + 0.6; // 7.8
    const bannerHeight = 1.28;

    const bannerFrameGeo = new THREE.BoxGeometry(bannerWidth + 0.24, bannerHeight + 0.2, 0.32);
    const bannerFrameMesh = new THREE.Mesh(bannerFrameGeo, yellowAccentMaterial);
    bannerFrameMesh.name = 'QuestionBannerFrame';
    bannerFrameMesh.position.set(0, 4.72, 0);
    bannerFrameMesh.castShadow = true;
    this.group.add(bannerFrameMesh);

    const questionTex = this.createQuestionBannerTexture(this.getQuestionText());
    const bannerFaceGeo = new THREE.PlaneGeometry(bannerWidth, bannerHeight);
    const bannerFaceMat = new THREE.MeshBasicMaterial({
      map: questionTex,
      color: 0xffffff,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.questionBannerMesh = new THREE.Mesh(bannerFaceGeo, bannerFaceMat);
    this.questionBannerMesh.name = 'QuestionBannerMesh';
    this.questionBannerMesh.position.set(0, 4.72, 0.17);
    this.group.add(this.questionBannerMesh);

    // 3. Three Lane Answer Portals (Left: -2.4, Center: 0, Right: +2.4)
    const portalWidth = LANE_WIDTH - 0.34; // 2.06
    const signHeight = 0.92;
    const barrierHeight = 2.35;

    const signBackingGeo = new THREE.BoxGeometry(portalWidth + 0.12, signHeight + 0.12, 0.22);
    const signFaceGeo = new THREE.PlaneGeometry(portalWidth, signHeight);
    const barrierGeo = new THREE.PlaneGeometry(portalWidth - 0.08, barrierHeight);

    LANE_POSITIONS.forEach((laneX, laneIdx) => {
      const optionValue = this.question.options[laneIdx];
      const laneLabel = LANE_LABELS[laneIdx].toUpperCase();

      const portalGroup = new THREE.Group();
      portalGroup.name = `LanePortal_${laneIdx}`;
      portalGroup.position.set(laneX, 0, 0);

      // Frame backing for the option sign at y = 3.15
      const frameMat = darkFrameMaterial.clone();
      const frameBacking = new THREE.Mesh(signBackingGeo, frameMat);
      frameBacking.name = `PortalFrame_${laneIdx}`;
      frameBacking.position.set(0, 3.15, 0);
      portalGroup.add(frameBacking);
      this.portalFrames.push(frameBacking);

      // High-contrast Option Number Signboard (y = 3.15)
      const signTex = this.createOptionSignTexture(optionValue, laneLabel);
      const signMat = new THREE.MeshBasicMaterial({
        map: signTex,
        color: 0xffffff,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const signMesh = new THREE.Mesh(signFaceGeo, signMat);
      signMesh.name = `OptionSignMesh_${laneIdx}`;
      signMesh.position.set(0, 3.15, 0.12);
      portalGroup.add(signMesh);
      this.optionSignMeshes.push(signMesh);

      // Translucent Energy Barrier Curtain in the lane opening (y = 1.32)
      const barrierTex = this.createEnergyBarrierTexture(optionValue);
      const barrierMat = new THREE.MeshBasicMaterial({
        map: barrierTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
      barrierMesh.name = `EnergyBarrierMesh_${laneIdx}`;
      barrierMesh.position.set(0, 1.32, 0);
      barrierMesh.renderOrder = 5;
      portalGroup.add(barrierMesh);
      this.energyBarrierMeshes.push(barrierMesh);

      this.group.add(portalGroup);
    });
  }

  private createQuestionBannerTexture(questionText: string): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Deep high-contrast dark navy background
    ctx.fillStyle = '#091526';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bright cyan inner border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Question text in large bold typography
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 104px "Chakra Petch", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(questionText, canvas.width / 2, canvas.height / 2 + 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.generatedTextures.push(texture);
    return texture;
  }

  private createOptionSignTexture(
    optionValue: number,
    laneLabel: string,
    state: 'neutral' | 'correct' | 'incorrect' = 'neutral',
  ): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const bgColors = {
      neutral: '#0f172a',
      correct: '#064e3b',
      incorrect: '#7f1d1d',
    };
    const borderColors = {
      neutral: '#38bdf8',
      correct: '#34d399',
      incorrect: '#f87171',
    };

    ctx.fillStyle = bgColors[state];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = borderColors[state];
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Top accessible lane label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(laneLabel, canvas.width / 2, 24);

    // Large high-contrast option number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 132px "Chakra Petch", "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(optionValue), canvas.width / 2, 152);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.generatedTextures.push(texture);
    return texture;
  }

  private createEnergyBarrierTexture(
    optionValue: number,
    state: 'neutral' | 'correct' | 'incorrect' = 'neutral',
  ): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (state === 'correct') {
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
      grad.addColorStop(0.5, 'rgba(5, 150, 105, 0.32)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.65)');
    } else if (state === 'incorrect') {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
      grad.addColorStop(0.5, 'rgba(185, 28, 28, 0.32)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.65)');
    } else {
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.5, 'rgba(29, 78, 216, 0.22)');
      grad.addColorStop(1, 'rgba(250, 204, 21, 0.48)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle energy scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.fillRect(0, y, canvas.width, 6);
    }

    // Side glowing border rails
    ctx.strokeStyle =
      state === 'correct'
        ? '#34d399'
        : state === 'incorrect'
          ? '#f87171'
          : '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Big translucent option number in the center of the portal curtain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = 'bold 112px "Chakra Petch", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(optionValue), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    this.generatedTextures.push(texture);
    return texture;
  }

  private applyResolutionVisuals(selectedLane: LaneIndex, isCorrect: boolean): void {
    LANE_POSITIONS.forEach((_, idx) => {
      const laneIdx = idx as LaneIndex;
      const optionValue = this.question.options[laneIdx];
      const laneLabel = LANE_LABELS[laneIdx].toUpperCase();
      const isThisCorrect = laneIdx === this.question.correctIndex;
      const isThisSelected = laneIdx === selectedLane;

      let visualState: 'neutral' | 'correct' | 'incorrect' = 'neutral';
      if (isThisCorrect) {
        visualState = 'correct';
      } else if (isThisSelected && !isCorrect) {
        visualState = 'incorrect';
      }

      const signMesh = this.optionSignMeshes[laneIdx];
      if (signMesh) {
        const signMat = signMesh.material as THREE.MeshBasicMaterial;
        const nextTex = this.createOptionSignTexture(optionValue, laneLabel, visualState);
        if (nextTex) {
          signMat.map = nextTex;
          signMat.needsUpdate = true;
        }
      }

      const barrierMesh = this.energyBarrierMeshes[laneIdx];
      if (barrierMesh) {
        const barrierMat = barrierMesh.material as THREE.MeshBasicMaterial;
        if (isThisSelected && isCorrect) {
          // Open / dissolve the correct portal as the robot passes through
          barrierMat.opacity = 0.18;
        } else {
          const nextBarrierTex = this.createEnergyBarrierTexture(optionValue, visualState);
          if (nextBarrierTex) {
            barrierMat.map = nextBarrierTex;
            barrierMat.needsUpdate = true;
          }
        }
      }
    });
  }

  /**
   * Advances the gate along +Z toward the player and checks if the robot passes through.
   * Returns a MathGateTriggerResult at most ONCE when crossing triggerZ.
   */
  public update(
    delta: number,
    speed: number,
    robotLane?: LaneIndex,
    triggerZ = ROBOT_DEFAULT_Z,
  ): MathGateTriggerResult | null {
    const safeDelta = Math.min(Math.max(delta, 0), 0.1);
    this.previousZ = this.group.position.z;

    if (speed > 0) {
      this.group.position.z += safeDelta * speed;
    }

    if (robotLane !== undefined) {
      return this.checkTrigger(robotLane, triggerZ);
    }

    return null;
  }

  /**
   * Evaluates the gate against the robot's current lane when crossing triggerZ.
   * Marks the gate as resolved BEFORE returning the result to prevent double triggers (T-009).
   */
  public checkTrigger(
    robotLane: LaneIndex,
    triggerZ = ROBOT_DEFAULT_Z,
  ): MathGateTriggerResult | null {
    if (this.resolved) {
      return null;
    }

    const currentZ = this.group.position.z;
    const crossedTriggerLine =
      (this.previousZ <= triggerZ && currentZ >= triggerZ) ||
      Math.abs(currentZ - triggerZ) <= 0.45;

    if (!crossedTriggerLine) {
      return null;
    }

    // Lock resolution flag first (DEVELOPMENT_PLAN Bab 7: "Tandai soal sebagai resolved sebelum memberikan skor")
    this.resolved = true;

    const safeLane: LaneIndex =
      robotLane === 0 || robotLane === 1 || robotLane === 2 ? robotLane : 1;
    const selectedOption = this.question.options[safeLane];
    const isCorrect = selectedOption === this.question.answer;

    this.applyResolutionVisuals(safeLane, isCorrect);

    return {
      questionId: this.question.id,
      question: this.question,
      selectedLane: safeLane,
      selectedOption,
      correctOption: this.question.answer,
      correctLane: this.question.correctIndex,
      isCorrect,
      scoreDelta: isCorrect ? 100 : 0,
      livesDelta: isCorrect ? 0 : -1,
    };
  }

  public isPastCleanupLine(cleanupZ = GATE_DESPAWN_Z): boolean {
    return this.group.position.z > cleanupZ;
  }

  public dispose(): void {
    this.generatedTextures.forEach((tex) => tex.dispose());
    this.generatedTextures = [];

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
