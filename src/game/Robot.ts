import * as THREE from 'three';
import { getLaneX } from './Track';
import { LANE_POSITIONS, LaneIndex, RobotAnimationState } from './types';

export const ROBOT_DEFAULT_Z = 4.0;

export const ROBOT_COLORS = {
  primaryBlue: 0x1d4ed8,
  lightBlue: 0x38bdf8,
  accentYellow: 0xfacc15,
  deepYellow: 0xeab308,
  darkSlate: 0x0f172a,
  jointMetal: 0x334155,
  eyeGlowNormal: 0x38bdf8,
  eyeGlowHappy: 0xfacc15,
  eyeGlowIncorrect: 0xf59e0b,
} as const;

export class Robot {
  public readonly group: THREE.Group;
  public readonly hasMouth = false as const;

  private bodyPivot: THREE.Group;
  private torsoGroup: THREE.Group;
  private headGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;

  private leftEyeMesh!: THREE.Mesh;
  private rightEyeMesh!: THREE.Mesh;
  private antennaBulbMesh!: THREE.Mesh;
  private chestCoreMesh!: THREE.Mesh;
  private leftThrusterGlow!: THREE.Mesh;
  private rightThrusterGlow!: THREE.Mesh;
  private contactShadowMesh: THREE.Mesh;

  private blueArmorMat: THREE.MeshStandardMaterial;
  private lightBlueMat: THREE.MeshStandardMaterial;
  private yellowTrimMat: THREE.MeshStandardMaterial;
  private darkJointMat: THREE.MeshStandardMaterial;
  private visorMat: THREE.MeshStandardMaterial;
  private eyeMat: THREE.MeshStandardMaterial;
  private glowCoreMat: THREE.MeshStandardMaterial;
  private shadowTexture: THREE.CanvasTexture | null = null;

  private currentLane: LaneIndex = 1;
  private currentX: number = LANE_POSITIONS[1];
  private targetX: number = LANE_POSITIONS[1];

  private animState: RobotAnimationState = 'run';
  private baseStateAfterReaction: 'run' | 'idle' = 'run';
  private reactionTimer = 0;
  private animTime = 0;
  private stridePhase = 0;
  private blinkTimer = 0;

  constructor(initialLane: LaneIndex = 1) {
    this.currentLane = this.clampLane(initialLane);
    this.currentX = getLaneX(this.currentLane);
    this.targetX = this.currentX;

    this.group = new THREE.Group();
    this.group.name = 'RobotCharacter';
    this.group.position.set(this.currentX, 0, ROBOT_DEFAULT_Z);

    // Calibrated PBR materials with varied roughness (>= 0.25 contrast) and metalness
    this.blueArmorMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.primaryBlue,
      roughness: 0.32,
      metalness: 0.45,
    });

    this.lightBlueMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.lightBlue,
      roughness: 0.25,
      metalness: 0.35,
    });

    this.yellowTrimMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.accentYellow,
      roughness: 0.22,
      metalness: 0.3,
    });

    this.darkJointMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.jointMetal,
      roughness: 0.68,
      metalness: 0.6,
    });

    this.visorMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.darkSlate,
      roughness: 0.12,
      metalness: 0.8,
    });

    this.eyeMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.eyeGlowNormal,
      emissive: ROBOT_COLORS.eyeGlowNormal,
      emissiveIntensity: 1.2,
      roughness: 0.15,
      metalness: 0.1,
    });

    this.glowCoreMat = new THREE.MeshStandardMaterial({
      color: ROBOT_COLORS.accentYellow,
      emissive: ROBOT_COLORS.accentYellow,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.2,
    });

    // 1. Soft Radial Contact Shadow Plane at y = 0.035
    this.shadowTexture = this.createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(1.75, 1.75);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      color: 0x000000,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.name = 'RobotContactShadow';
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.set(0, 0.035, 0);
    this.group.add(this.contactShadowMesh);

    // 2. Body Pivot (faces -Z down the track by default; +Z is behind toward chase camera)
    this.bodyPivot = new THREE.Group();
    this.bodyPivot.name = 'RobotBodyPivot';
    this.group.add(this.bodyPivot);

    // 3. Build Composite Sub-Groups (Torso, Head without mouth, Arms, Legs)
    this.torsoGroup = this.buildTorso();
    this.headGroup = this.buildHeadWithoutMouth();
    this.leftArmGroup = this.buildArm('left');
    this.rightArmGroup = this.buildArm('right');
    this.leftLegGroup = this.buildLeg('left');
    this.rightLegGroup = this.buildLeg('right');

    this.bodyPivot.add(
      this.torsoGroup,
      this.headGroup,
      this.leftArmGroup,
      this.rightArmGroup,
      this.leftLegGroup,
      this.rightLegGroup,
    );

    // Enable shadow casting and receiving on all robot body meshes
    this.bodyPivot.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  private createContactShadowTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildTorso(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'RobotTorso';
    group.position.set(0, 1.15, 0);

    // Primary silhouette: Blue chest/torso hull
    const hullGeo = new THREE.BoxGeometry(0.88, 0.78, 0.56);
    const hullMesh = new THREE.Mesh(hullGeo, this.blueArmorMat);
    hullMesh.name = 'TorsoHull';
    group.add(hullMesh);

    // Upper collar rim (Yellow)
    const collarGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.12, 16);
    const collarMesh = new THREE.Mesh(collarGeo, this.yellowTrimMat);
    collarMesh.position.set(0, 0.42, 0);
    group.add(collarMesh);

    // Front chest armor plate (-Z face)
    const chestPlateGeo = new THREE.BoxGeometry(0.68, 0.5, 0.08);
    const chestPlate = new THREE.Mesh(chestPlateGeo, this.yellowTrimMat);
    chestPlate.name = 'ChestPlate';
    chestPlate.position.set(0, 0.04, -0.28);
    group.add(chestPlate);

    // Glowing energy core emblem on front chest
    const coreGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 20);
    this.chestCoreMesh = new THREE.Mesh(coreGeo, this.glowCoreMat);
    this.chestCoreMesh.name = 'ChestEnergyCore';
    this.chestCoreMesh.rotation.x = Math.PI / 2;
    this.chestCoreMesh.position.set(0, 0.04, -0.32);
    group.add(this.chestCoreMesh);

    // Waist / Hip belt (Yellow & Dark Metal)
    const beltGeo = new THREE.BoxGeometry(0.82, 0.14, 0.52);
    const beltMesh = new THREE.Mesh(beltGeo, this.yellowTrimMat);
    beltMesh.position.set(0, -0.4, 0);
    group.add(beltMesh);

    const pelvisGeo = new THREE.BoxGeometry(0.68, 0.16, 0.44);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, this.darkJointMat);
    pelvisMesh.position.set(0, -0.5, 0);
    group.add(pelvisMesh);

    // Secondary read: Booster Backpack on +Z face (clearly visible to chase camera)
    const packGeo = new THREE.BoxGeometry(0.62, 0.52, 0.26);
    const packMesh = new THREE.Mesh(packGeo, this.yellowTrimMat);
    packMesh.name = 'BoosterBackpack';
    packMesh.position.set(0, 0.05, 0.36);
    group.add(packMesh);

    const packStripeGeo = new THREE.BoxGeometry(0.46, 0.34, 0.06);
    const packStripe = new THREE.Mesh(packStripeGeo, this.blueArmorMat);
    packStripe.position.set(0, 0.05, 0.48);
    group.add(packStripe);

    // Twin booster thruster nozzles
    const nozzleGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.18, 14);
    const glowGeo = new THREE.SphereGeometry(0.085, 12, 12);

    const leftNozzle = new THREE.Mesh(nozzleGeo, this.darkJointMat);
    leftNozzle.position.set(-0.17, -0.24, 0.38);
    leftNozzle.rotation.x = 0.2;

    this.leftThrusterGlow = new THREE.Mesh(glowGeo, this.glowCoreMat);
    this.leftThrusterGlow.position.set(-0.17, -0.32, 0.4);

    const rightNozzle = new THREE.Mesh(nozzleGeo, this.darkJointMat);
    rightNozzle.position.set(0.17, -0.24, 0.38);
    rightNozzle.rotation.x = 0.2;

    this.rightThrusterGlow = new THREE.Mesh(glowGeo, this.glowCoreMat);
    this.rightThrusterGlow.position.set(0.17, -0.32, 0.4);

    group.add(
      leftNozzle,
      rightNozzle,
      this.leftThrusterGlow,
      this.rightThrusterGlow,
    );

    return group;
  }

  /**
   * Builds the robot head strictly WITHOUT a mouth (PRD Bab 10: "Tidak memiliki mulut").
   * Expressiveness comes exclusively from the twin glowing eyes, visor, antenna, and head tilt.
   */
  private buildHeadWithoutMouth(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'RobotHeadGroup';
    group.position.set(0, 1.66, 0);

    // Main blue head cranium positioned relative to neck pivot
    const headGeo = new THREE.BoxGeometry(0.76, 0.62, 0.62);
    const headMesh = new THREE.Mesh(headGeo, this.blueArmorMat);
    headMesh.name = 'HeadCranium';
    headMesh.position.set(0, 0.34, 0);
    group.add(headMesh);

    // Yellow forehead/crown crest
    const crownGeo = new THREE.BoxGeometry(0.58, 0.1, 0.5);
    const crownMesh = new THREE.Mesh(crownGeo, this.yellowTrimMat);
    crownMesh.name = 'HeadCrown';
    crownMesh.position.set(0, 0.68, 0);
    group.add(crownMesh);

    // Left & Right Yellow Ear Audio-Sensors
    const earGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16);
    const leftEar = new THREE.Mesh(earGeo, this.yellowTrimMat);
    leftEar.name = 'LeftEarSensor';
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.42, 0.34, 0);

    const rightEar = new THREE.Mesh(earGeo, this.yellowTrimMat);
    rightEar.name = 'RightEarSensor';
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(0.42, 0.34, 0);
    group.add(leftEar, rightEar);

    // Top Antenna Assembly (Base + Stem + Glowing Bulb)
    const antBaseGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.08, 14);
    const antBase = new THREE.Mesh(antBaseGeo, this.darkJointMat);
    antBase.position.set(0, 0.75, 0);

    const antStemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.24, 10);
    const antStem = new THREE.Mesh(antStemGeo, this.lightBlueMat);
    antStem.position.set(0, 0.89, 0);

    const antBulbGeo = new THREE.SphereGeometry(0.09, 16, 16);
    this.antennaBulbMesh = new THREE.Mesh(antBulbGeo, this.glowCoreMat);
    this.antennaBulbMesh.name = 'AntennaBulb';
    this.antennaBulbMesh.position.set(0, 1.03, 0);

    group.add(antBase, antStem, this.antennaBulbMesh);

    // Front Visor Panel (-Z face) — houses ONLY the two eyes (NO MOUTH)
    const visorGeo = new THREE.BoxGeometry(0.62, 0.38, 0.06);
    const visorMesh = new THREE.Mesh(visorGeo, this.visorMat);
    visorMesh.name = 'FaceVisor';
    visorMesh.position.set(0, 0.36, -0.3);
    group.add(visorMesh);

    // Expressive Twin Glowing Eyes (No mouth geometry exists anywhere)
    const eyeGeo = new THREE.SphereGeometry(0.085, 16, 16);
    this.leftEyeMesh = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.leftEyeMesh.name = 'LeftEye';
    this.leftEyeMesh.scale.set(1.0, 1.2, 0.5);
    this.leftEyeMesh.position.set(-0.15, 0.36, -0.33);

    this.rightEyeMesh = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.rightEyeMesh.name = 'RightEye';
    this.rightEyeMesh.scale.set(1.0, 1.2, 0.5);
    this.rightEyeMesh.position.set(0.15, 0.36, -0.33);

    group.add(this.leftEyeMesh, this.rightEyeMesh);

    return group;
  }

  private buildArm(side: 'left' | 'right'): THREE.Group {
    const sign = side === 'left' ? -1 : 1;
    const group = new THREE.Group();
    group.name = side === 'left' ? 'LeftArmGroup' : 'RightArmGroup';
    // Shoulder pivot at y = 1.44, x = ±0.56
    group.position.set(sign * 0.56, 1.44, 0);

    // Yellow shoulder pauldron
    const shoulderGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, this.yellowTrimMat);
    group.add(shoulderMesh);

    // Upper blue arm
    const upperGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.32, 12);
    const upperMesh = new THREE.Mesh(upperGeo, this.blueArmorMat);
    upperMesh.position.set(0, -0.18, 0);
    group.add(upperMesh);

    // Dark metallic elbow joint
    const elbowGeo = new THREE.SphereGeometry(0.095, 12, 12);
    const elbowMesh = new THREE.Mesh(elbowGeo, this.darkJointMat);
    elbowMesh.position.set(0, -0.35, 0);
    group.add(elbowMesh);

    // Forearm cuff (Light Blue)
    const forearmGeo = new THREE.CylinderGeometry(0.095, 0.11, 0.26, 12);
    const forearmMesh = new THREE.Mesh(forearmGeo, this.lightBlueMat);
    forearmMesh.position.set(0, -0.49, -0.03);
    forearmMesh.rotation.x = 0.2;
    group.add(forearmMesh);

    // Yellow rounded robot hand
    const handGeo = new THREE.SphereGeometry(0.12, 14, 14);
    const handMesh = new THREE.Mesh(handGeo, this.yellowTrimMat);
    handMesh.position.set(0, -0.64, -0.06);
    group.add(handMesh);

    return group;
  }

  private buildLeg(side: 'left' | 'right'): THREE.Group {
    const sign = side === 'left' ? -1 : 1;
    const group = new THREE.Group();
    group.name = side === 'left' ? 'LeftLegGroup' : 'RightLegGroup';
    // Hip pivot at y = 0.68, x = ±0.24 so boot sole sits flush at y = 0.0
    group.position.set(sign * 0.24, 0.68, 0);

    // Upper thigh (Blue)
    const thighGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.3, 12);
    const thighMesh = new THREE.Mesh(thighGeo, this.blueArmorMat);
    thighMesh.position.set(0, -0.16, 0);
    group.add(thighMesh);

    // Yellow knee joint
    const kneeGeo = new THREE.SphereGeometry(0.115, 12, 12);
    const kneeMesh = new THREE.Mesh(kneeGeo, this.yellowTrimMat);
    kneeMesh.position.set(0, -0.33, 0);
    group.add(kneeMesh);

    // Lower shin (Light Blue)
    const shinGeo = new THREE.CylinderGeometry(0.105, 0.12, 0.24, 12);
    const shinMesh = new THREE.Mesh(shinGeo, this.lightBlueMat);
    shinMesh.position.set(0, -0.46, 0);
    group.add(shinMesh);

    // Sturdy Yellow & Blue Boot (bottom at y = -0.68 relative to hip => world y = 0.0)
    const bootGeo = new THREE.BoxGeometry(0.28, 0.16, 0.4);
    const bootMesh = new THREE.Mesh(bootGeo, this.yellowTrimMat);
    bootMesh.position.set(0, -0.6, -0.04);
    group.add(bootMesh);

    const soleGeo = new THREE.BoxGeometry(0.3, 0.05, 0.42);
    const soleMesh = new THREE.Mesh(soleGeo, this.blueArmorMat);
    soleMesh.position.set(0, -0.655, -0.04);
    group.add(soleMesh);

    return group;
  }

  private clampLane(lane: number): LaneIndex {
    if (lane <= 0) return 0;
    if (lane >= 2) return 2;
    return 1;
  }

  public setLane(lane: LaneIndex): void {
    const safeLane = this.clampLane(lane);
    this.currentLane = safeLane;
    this.targetX = getLaneX(safeLane);
  }

  public moveLeft(): LaneIndex {
    const next = this.clampLane(this.currentLane - 1);
    this.setLane(next);
    return this.currentLane;
  }

  public moveRight(): LaneIndex {
    const next = this.clampLane(this.currentLane + 1);
    this.setLane(next);
    return this.currentLane;
  }

  public getLane(): LaneIndex {
    return this.currentLane;
  }

  public getCurrentX(): number {
    return this.currentX;
  }

  public getTargetX(): number {
    return this.targetX;
  }

  public setAnimationState(state: RobotAnimationState): void {
    this.animState = state;
    if (state === 'run' || state === 'idle') {
      this.baseStateAfterReaction = state;
      this.reactionTimer = 0;
    }
    this.updateEyeColorForState(state);
  }

  public getAnimationState(): RobotAnimationState {
    return this.animState;
  }

  public triggerReaction(
    type: 'celebrate' | 'incorrect' | 'victory' | 'defeat',
    durationSeconds = 1.2,
  ): void {
    this.animState = type;
    this.reactionTimer = Math.max(0.2, durationSeconds);
    this.animTime = 0;
    this.updateEyeColorForState(type);
  }

  private updateEyeColorForState(state: RobotAnimationState): void {
    if (state === 'celebrate' || state === 'victory') {
      this.eyeMat.color.setHex(ROBOT_COLORS.eyeGlowHappy);
      this.eyeMat.emissive.setHex(ROBOT_COLORS.eyeGlowHappy);
    } else if (state === 'incorrect' || state === 'defeat') {
      this.eyeMat.color.setHex(ROBOT_COLORS.eyeGlowIncorrect);
      this.eyeMat.emissive.setHex(ROBOT_COLORS.eyeGlowIncorrect);
    } else {
      this.eyeMat.color.setHex(ROBOT_COLORS.eyeGlowNormal);
      this.eyeMat.emissive.setHex(ROBOT_COLORS.eyeGlowNormal);
    }
  }

  public update(delta: number, trackSpeed = 14): void {
    const safeDelta = Math.min(Math.max(delta, 0), 0.1);
    this.animTime += safeDelta;
    this.blinkTimer += safeDelta;

    // Handle timed reaction state expiration
    if (this.reactionTimer > 0) {
      this.reactionTimer -= safeDelta;
      if (this.reactionTimer <= 0) {
        this.reactionTimer = 0;
        this.setAnimationState(this.baseStateAfterReaction);
      }
    }

    // 1. Smooth horizontal lane transition using exponential damping
    this.currentX = THREE.MathUtils.damp(this.currentX, this.targetX, 14, safeDelta);
    this.group.position.x = this.currentX;

    // Lateral velocity cue for dynamic lane-change banking (roll & yaw)
    const lateralDiff = this.targetX - this.currentX;
    const bankRoll = THREE.MathUtils.clamp(-lateralDiff * 0.22, -0.32, 0.32);
    const turnYaw = THREE.MathUtils.clamp(-lateralDiff * 0.18, -0.28, 0.28);

    // Periodic natural eye blink every ~3.4 seconds
    const isBlinking = this.blinkTimer % 3.4 > 3.26;
    const baseEyeScaleY = isBlinking ? 0.12 : 1.2;

    // 2. State-driven procedural kinematics
    if (this.animState === 'run') {
      const effectiveSpeed = Math.max(trackSpeed, 6);
      this.stridePhase += safeDelta * effectiveSpeed * 0.85;

      const legSwing = Math.sin(this.stridePhase) * 0.68;
      const armSwing = Math.sin(this.stridePhase) * 0.58;
      const verticalBounce = Math.abs(Math.sin(this.stridePhase)) * 0.11;

      this.bodyPivot.position.y = verticalBounce;
      this.bodyPivot.rotation.z = bankRoll;
      this.bodyPivot.rotation.y = turnYaw;
      this.bodyPivot.rotation.x = -0.08; // Slight athletic forward lean toward -Z

      this.leftLegGroup.rotation.x = legSwing;
      this.rightLegGroup.rotation.x = -legSwing;

      this.leftArmGroup.rotation.x = -armSwing;
      this.rightArmGroup.rotation.x = armSwing;
      this.leftArmGroup.rotation.z = 0.08;
      this.rightArmGroup.rotation.z = -0.08;

      // Subtle expressive head bob and look into the lane turn
      this.headGroup.rotation.y = turnYaw * 0.8 + Math.sin(this.stridePhase * 0.5) * 0.06;
      this.headGroup.rotation.z = bankRoll * 0.5;
      this.headGroup.rotation.x = Math.cos(this.stridePhase * 2) * 0.04;

      this.leftEyeMesh.scale.set(1.0, baseEyeScaleY, 0.5);
      this.rightEyeMesh.scale.set(1.0, baseEyeScaleY, 0.5);

      const thrusterPulse = 0.85 + Math.sin(this.stridePhase * 2) * 0.25;
      this.leftThrusterGlow.scale.setScalar(thrusterPulse);
      this.rightThrusterGlow.scale.setScalar(thrusterPulse);
    } else if (this.animState === 'celebrate' || this.animState === 'victory') {
      const jumpWave = Math.abs(Math.sin(this.animTime * 9)) * 0.34;
      this.bodyPivot.position.y = jumpWave;
      this.bodyPivot.rotation.x = 0.05;
      this.bodyPivot.rotation.z = bankRoll + Math.sin(this.animTime * 8) * 0.1;
      this.bodyPivot.rotation.y =
        this.animState === 'victory'
          ? Math.sin(this.animTime * 3.5) * 0.45
          : turnYaw;

      // Both arms raised cheering
      this.leftArmGroup.rotation.x = Math.PI * 0.85 + Math.sin(this.animTime * 12) * 0.25;
      this.rightArmGroup.rotation.x = Math.PI * 0.85 - Math.sin(this.animTime * 12) * 0.25;
      this.leftArmGroup.rotation.z = -0.28;
      this.rightArmGroup.rotation.z = 0.28;

      this.leftLegGroup.rotation.x = -0.25;
      this.rightLegGroup.rotation.x = 0.25;

      this.headGroup.rotation.y = Math.sin(this.animTime * 6) * 0.2;
      this.headGroup.rotation.z = Math.cos(this.animTime * 6) * 0.12;
      this.headGroup.rotation.x = -0.1;

      // Happy wide eyes
      this.leftEyeMesh.scale.set(1.25, 1.45, 0.5);
      this.rightEyeMesh.scale.set(1.25, 1.45, 0.5);
    } else if (this.animState === 'incorrect' || this.animState === 'defeat') {
      this.bodyPivot.position.y = THREE.MathUtils.damp(this.bodyPivot.position.y, 0, 10, safeDelta);
      this.bodyPivot.rotation.x = 0.12; // Slight empathetic droop
      this.bodyPivot.rotation.z = bankRoll;
      this.bodyPivot.rotation.y = turnYaw;

      // Gentle head shake
      this.headGroup.rotation.y = Math.sin(this.animTime * 14) * 0.28;
      this.headGroup.rotation.x = 0.16;
      this.headGroup.rotation.z = 0;

      this.leftArmGroup.rotation.x = 0.15;
      this.rightArmGroup.rotation.x = 0.15;
      this.leftArmGroup.rotation.z = 0.18;
      this.rightArmGroup.rotation.z = -0.18;

      this.leftLegGroup.rotation.x = 0;
      this.rightLegGroup.rotation.x = 0;

      // Squinted attentive eyes
      this.leftEyeMesh.scale.set(1.1, 0.65, 0.5);
      this.rightEyeMesh.scale.set(1.1, 0.65, 0.5);
    } else {
      // 'idle' state
      const breath = Math.sin(this.animTime * 2.6) * 0.035;
      this.bodyPivot.position.y = Math.max(0, breath);
      this.bodyPivot.rotation.x = THREE.MathUtils.damp(this.bodyPivot.rotation.x, 0, 8, safeDelta);
      this.bodyPivot.rotation.z = bankRoll;
      this.bodyPivot.rotation.y = turnYaw;

      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0, 10, safeDelta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0, 10, safeDelta);

      this.leftArmGroup.rotation.x = Math.sin(this.animTime * 2.2) * 0.08;
      this.rightArmGroup.rotation.x = -Math.sin(this.animTime * 2.2) * 0.08;
      this.leftArmGroup.rotation.z = 0.08;
      this.rightArmGroup.rotation.z = -0.08;

      this.headGroup.rotation.y = Math.sin(this.animTime * 1.4) * 0.14;
      this.headGroup.rotation.z = Math.cos(this.animTime * 1.1) * 0.05;
      this.headGroup.rotation.x = 0;

      this.leftEyeMesh.scale.set(1.0, baseEyeScaleY, 0.5);
      this.rightEyeMesh.scale.set(1.0, baseEyeScaleY, 0.5);
      this.leftThrusterGlow.scale.setScalar(0.65);
      this.rightThrusterGlow.scale.setScalar(0.65);
    }

    // Scale contact shadow inversely with jump height so grounding remains realistic
    const shadowScale = THREE.MathUtils.clamp(1 - this.bodyPivot.position.y * 0.55, 0.65, 1.05);
    this.contactShadowMesh.scale.set(shadowScale, shadowScale, 1);
  }

  public dispose(): void {
    this.shadowTexture?.dispose();
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
