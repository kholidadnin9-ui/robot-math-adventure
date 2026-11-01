import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { generateLevelQuestions } from '../math/questionGenerator';
import { getLevelTheme } from './levelThemes';
import { GATE_SPAWN_Z, MathGate, MathGateTriggerResult } from './MathGate';
import { Robot, ROBOT_DEFAULT_Z } from './Robot';
import { getLaneX, Track } from './Track';
import {
  CameraPreset,
  LaneIndex,
  LevelThemeConfig,
  MultiplicationQuestion,
  RobotAnimationState,
  ViewportMetrics,
} from './types';

export const SPARKLE_PARTICLE_COUNT = 72;

const SPARKLE_PALETTES = {
  correct: [
    new THREE.Color(0xfacc15), // Gold Yellow
    new THREE.Color(0x34d399), // Emerald Green
    new THREE.Color(0x38bdf8), // Sky Blue
    new THREE.Color(0xffffff), // Crisp White
  ],
  gate: [
    new THREE.Color(0x38bdf8), // Sky Blue
    new THREE.Color(0xf59e0b), // Amber
    new THREE.Color(0xe2e8f0), // Soft Silver
  ],
} as const;

/**
 * Pooled BufferGeometry sparkle particle controller used by SceneManager
 * to render 'sparkles' when the robot answers a question correctly or passes a gate.
 */
export class SparkleParticleController {
  public readonly geometry: THREE.BufferGeometry;
  public readonly material: THREE.PointsMaterial;
  public readonly points: THREE.Points;

  private texture: THREE.CanvasTexture | null = null;
  private positions: Float32Array;
  private colors: Float32Array;
  private baseColors: Float32Array;
  private velocities: Float32Array;
  private ages: Float32Array;
  private lifetimes: Float32Array;
  private active = false;

  constructor(count = SPARKLE_PARTICLE_COUNT) {
    this.geometry = new THREE.BufferGeometry();

    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.baseColors = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.ages = new Float32Array(count);
    this.lifetimes = new Float32Array(count);

    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const colAttr = new THREE.BufferAttribute(this.colors, 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', posAttr);
    this.geometry.setAttribute('color', colAttr);

    this.texture = this.createSparkleTexture();

    this.material = new THREE.PointsMaterial({
      size: 0.42,
      map: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'SparkleParticleSystem';
    this.points.frustumCulled = false;
    this.points.visible = false;
    this.points.renderOrder = 12;
  }

  private createSparkleTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.quadraticCurveTo(34, 30, 60, 32);
    ctx.quadraticCurveTo(34, 34, 32, 60);
    ctx.quadraticCurveTo(30, 34, 4, 32);
    ctx.quadraticCurveTo(30, 30, 32, 4);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  public emit(
    originX: number,
    originY = 1.45,
    originZ = ROBOT_DEFAULT_Z,
    mode: 'correct' | 'gate' = 'correct',
  ): void {
    const count = this.ages.length;
    const palette = SPARKLE_PALETTES[mode];
    const speedMultiplier = mode === 'correct' ? 1.0 : 0.65;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 0.25 + Math.random() * 0.55;

      this.positions[i3] = originX + Math.cos(angle) * radius;
      this.positions[i3 + 1] = originY + (Math.random() - 0.3) * 0.7;
      this.positions[i3 + 2] = originZ + Math.sin(angle) * radius * 0.6;

      const outwardSpeed = (1.6 + Math.random() * 2.8) * speedMultiplier;
      this.velocities[i3] = Math.cos(angle) * outwardSpeed;
      this.velocities[i3 + 1] = (2.2 + Math.random() * 3.4) * speedMultiplier;
      this.velocities[i3 + 2] = Math.sin(angle) * outwardSpeed * 0.75;

      const chosenColor = palette[i % palette.length];
      this.baseColors[i3] = chosenColor.r;
      this.baseColors[i3 + 1] = chosenColor.g;
      this.baseColors[i3 + 2] = chosenColor.b;

      this.colors[i3] = chosenColor.r;
      this.colors[i3 + 1] = chosenColor.g;
      this.colors[i3 + 2] = chosenColor.b;

      this.ages[i] = 0;
      this.lifetimes[i] =
        mode === 'correct'
          ? 0.65 + Math.random() * 0.45
          : 0.4 + Math.random() * 0.3;
    }

    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

    this.active = true;
    this.points.visible = true;
  }

  public update(delta: number): void {
    if (!this.active) return;

    const safeDelta = Math.min(Math.max(delta, 0), 0.1);
    const count = this.ages.length;
    let aliveCount = 0;

    for (let i = 0; i < count; i++) {
      const lifetime = this.lifetimes[i];
      const age = this.ages[i] + safeDelta;
      this.ages[i] = age;

      const i3 = i * 3;
      if (age < lifetime) {
        aliveCount++;

        this.positions[i3] += this.velocities[i3] * safeDelta;
        this.positions[i3 + 1] += this.velocities[i3 + 1] * safeDelta;
        this.positions[i3 + 2] += this.velocities[i3 + 2] * safeDelta;

        this.velocities[i3 + 1] -= 6.2 * safeDelta;
        this.velocities[i3] *= 1 - 1.5 * safeDelta;
        this.velocities[i3 + 2] *= 1 - 1.5 * safeDelta;

        const lifeRatio = 1 - age / lifetime;
        const brightness = Math.min(1, lifeRatio * 1.35);
        this.colors[i3] = this.baseColors[i3] * brightness;
        this.colors[i3 + 1] = this.baseColors[i3 + 1] * brightness;
        this.colors[i3 + 2] = this.baseColors[i3 + 2] * brightness;
      } else {
        this.positions[i3 + 1] = -10;
        this.colors[i3] = 0;
        this.colors[i3 + 1] = 0;
        this.colors[i3 + 2] = 0;
      }
    }

    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

    if (aliveCount === 0) {
      this.active = false;
      this.points.visible = false;
    }
  }

  public clear(): void {
    this.active = false;
    this.points.visible = false;
  }

  public isActive(): boolean {
    return this.active;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.texture?.dispose();
  }
}

export interface ResponsiveCameraParams {
  aspect: number;
  isPortraitMobile: boolean;
  fov: number;
  targetPosition: [number, number, number];
  lookAtTarget: [number, number, number];
}

export function computeResponsiveCameraParams(
  width: number,
  height: number,
  preset: CameraPreset = 'standard',
  activeLaneX = 0,
): ResponsiveCameraParams {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const aspect = safeWidth / safeHeight;
  const isPortraitMobile = aspect < 0.85;

  const portraitCompensation = isPortraitMobile ? Math.min((0.85 - aspect) * 32, 16) : 0;
  const zPullback = isPortraitMobile ? Math.min((0.85 - aspect) * 6.5, 3.2) : 0;
  const yLift = isPortraitMobile ? Math.min((0.85 - aspect) * 2.4, 1.2) : 0;

  const followX = activeLaneX * 0.22;

  if (preset === 'overhead') {
    return {
      aspect,
      isPortraitMobile,
      fov: 54 + portraitCompensation * 0.6,
      targetPosition: [followX * 0.5, 9.5 + yLift, 11.5 + zPullback],
      lookAtTarget: [followX * 0.3, 0.2, -10],
    };
  }

  if (preset === 'close') {
    return {
      aspect,
      isPortraitMobile,
      fov: 50 + portraitCompensation,
      targetPosition: [followX * 1.4, 3.1 + yLift * 0.6, 8.2 + zPullback * 0.7],
      lookAtTarget: [activeLaneX * 0.65, 1.1, -10],
    };
  }

  if (preset === 'front') {
    return {
      aspect,
      isPortraitMobile,
      fov: 46 + portraitCompensation * 0.5,
      targetPosition: [activeLaneX * 0.85, 2.15, ROBOT_DEFAULT_Z - 3.6 - zPullback * 0.4],
      lookAtTarget: [activeLaneX, 1.35, ROBOT_DEFAULT_Z],
    };
  }

  return {
    aspect,
    isPortraitMobile,
    fov: 52 + portraitCompensation,
    targetPosition: [followX, 4.6 + yLift, 10.6 + zPullback],
    lookAtTarget: [followX * 0.45, 0.6, -16],
  };
}

export function checkWebGLSupport(): { supported: boolean; isSoftwareGl: boolean; message?: string } {
  if (typeof document === 'undefined') {
    return { supported: false, isSoftwareGl: true, message: 'Lingkungan DOM tidak tersedia.' };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) {
      return {
        supported: false,
        isSoftwareGl: true,
        message:
          'Browser atau perangkat Anda tidak mendukung WebGL. Silakan gunakan browser modern (Chrome, Edge, Firefox, atau Safari) dengan akselerasi perangkat keras aktif.',
      };
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return {
      supported: false,
      isSoftwareGl: true,
      message: 'Gagal menginisialisasi konteks grafis 3D (WebGL).',
    };
  }
}

const _camTargetPos = new THREE.Vector3();
const _camLookAtGoal = new THREE.Vector3();

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private track: Track;
  private robot: Robot;
  private activeGate: MathGate | null = null;
  private clock: THREE.Clock;

  private sparkles!: SparkleParticleController;

  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private envTexture: THREE.Texture | null = null;

  private isSoftwareGl: boolean;
  private maxAnisotropy: number;
  private frameId = 0;
  private isDisposed = false;

  private currentTheme: LevelThemeConfig;
  private levelQuestions: MultiplicationQuestion[] = [];
  private currentQuestionIndex = 0;

  private cameraPreset: CameraPreset = 'standard';
  private activeLane: LaneIndex = 1;
  private trackSpeed = 14;
  private isRunning = true;

  private currentLookAt = new THREE.Vector3(0, 0.6, -16);
  private fpsFrameCount = 0;
  private fpsAccumTime = 0;
  private currentFps = 60;

  private onMetricsUpdate?: (metrics: ViewportMetrics) => void;
  private onContextLost?: (lost: boolean) => void;
  private onQuestionChanged?: (
    question: MultiplicationQuestion,
    questionNumber: number,
    totalQuestions: number,
  ) => void;
  private onGateResolved?: (result: MathGateTriggerResult) => void;

  constructor(
    container: HTMLElement,
    options?: {
      initialLevelId?: number;
      onMetricsUpdate?: (metrics: ViewportMetrics) => void;
      onContextLost?: (lost: boolean) => void;
      onQuestionChanged?: (
        question: MultiplicationQuestion,
        questionNumber: number,
        totalQuestions: number,
      ) => void;
      onGateResolved?: (result: MathGateTriggerResult) => void;
    },
  ) {
    this.container = container;
    this.onMetricsUpdate = options?.onMetricsUpdate;
    this.onContextLost = options?.onContextLost;
    this.onQuestionChanged = options?.onQuestionChanged;
    this.onGateResolved = options?.onGateResolved;
    this.currentTheme = getLevelTheme(options?.initialLevelId ?? 1);

    const glStatus = checkWebGLSupport();
    this.isSoftwareGl = glStatus.isSoftwareGl;

    const width = Math.max(container.clientWidth || window.innerWidth, 1);
    const height = Math.max(container.clientHeight || window.innerHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const domCanvas = this.renderer.domElement;
    domCanvas.className = 'block w-full h-full outline-none';
    domCanvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    domCanvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
    this.container.appendChild(domCanvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.currentTheme.skyColor);
    this.scene.fog = new THREE.FogExp2(
      this.currentTheme.fogColor,
      this.currentTheme.fogDensity,
    );

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmremGenerator.dispose();

    const initialCam = computeResponsiveCameraParams(
      width,
      height,
      this.cameraPreset,
      getLaneX(this.activeLane),
    );
    this.camera = new THREE.PerspectiveCamera(
      initialCam.fov,
      initialCam.aspect,
      0.1,
      180,
    );
    this.camera.position.set(...initialCam.targetPosition);
    this.currentLookAt.set(...initialCam.lookAtTarget);
    this.camera.lookAt(this.currentLookAt);

    this.hemiLight = new THREE.HemisphereLight(
      this.currentTheme.ambientSkyColor,
      this.currentTheme.ambientGroundColor,
      0.75,
    );
    this.hemiLight.position.set(0, 40, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(this.currentTheme.keyLightColor, 1.85);
    this.keyLight.position.set(14, 24, 18);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    const d = 14;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 65;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(this.currentTheme.laneDividerColor, 0.75);
    this.rimLight.position.set(-10, 12, -22);
    this.scene.add(this.rimLight);

    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.track = new Track(this.currentTheme, this.maxAnisotropy);
    this.track.setHighlightedLane(this.activeLane);
    this.scene.add(this.track.group);

    this.robot = new Robot(this.activeLane);
    this.robot.setAnimationState(this.isRunning ? 'run' : 'idle');
    this.scene.add(this.robot.group);

    this.initSparkleParticleSystem();
    this.loadLevelQuestions(this.currentTheme.id);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.clock = new THREE.Clock();
    window.addEventListener('resize', this.onWindowResize);

    this.emitMetrics();
    this.startLoop();
  }

  private initSparkleParticleSystem(): void {
    this.sparkles = new SparkleParticleController(SPARKLE_PARTICLE_COUNT);
    this.scene.add(this.sparkles.points);
  }

  public emitSparkles(
    originX = this.robot.getCurrentX(),
    originY = 1.45,
    originZ = ROBOT_DEFAULT_Z,
    mode: 'correct' | 'gate' = 'correct',
  ): void {
    this.sparkles.emit(originX, originY, originZ, mode);
  }

  public updateParticles(delta: number): void {
    this.sparkles.update(delta);
  }

  public clearParticles(): void {
    this.sparkles?.clear();
  }

  public getParticleSystem(): THREE.Points {
    return this.sparkles.points;
  }

  public isParticleBurstActive(): boolean {
    return this.sparkles.isActive();
  }

  private loadLevelQuestions(levelId: number): void {
    this.levelQuestions = generateLevelQuestions(levelId);
    this.currentQuestionIndex = 0;
    this.clearParticles();
    this.spawnGateForCurrentQuestion(-42);
  }

  private spawnGateForCurrentQuestion(spawnZ = GATE_SPAWN_Z): void {
    if (this.activeGate) {
      this.scene.remove(this.activeGate.group);
      this.activeGate.dispose();
      this.activeGate = null;
    }

    if (this.levelQuestions.length === 0) {
      this.levelQuestions = generateLevelQuestions(this.currentTheme.id);
    }

    const question =
      this.levelQuestions[this.currentQuestionIndex % this.levelQuestions.length];
    this.activeGate = new MathGate(question, question.b, spawnZ, this.maxAnisotropy);
    this.scene.add(this.activeGate.group);

    this.onQuestionChanged?.(
      question,
      (this.currentQuestionIndex % this.levelQuestions.length) + 1,
      this.levelQuestions.length,
    );
  }

  public advanceToNextGate(): void {
    this.currentQuestionIndex =
      (this.currentQuestionIndex + 1) % Math.max(1, this.levelQuestions.length);
    this.spawnGateForCurrentQuestion(GATE_SPAWN_Z);
  }

  public getActiveGate(): MathGate | null {
    return this.activeGate;
  }

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.stopLoop();
    this.onContextLost?.(true);
  };

  private handleContextRestored = (): void => {
    this.onContextLost?.(false);
    this.clock.start();
    this.startLoop();
  };

  private onWindowResize = (): void => {
    if (this.isDisposed) return;
    const width = Math.max(this.container.clientWidth || window.innerWidth, 1);
    const height = Math.max(this.container.clientHeight || window.innerHeight, 1);
    this.handleResize(width, height);
  };

  public handleResize(width: number, height: number): void {
    const camParams = computeResponsiveCameraParams(
      width,
      height,
      this.cameraPreset,
      this.robot.getCurrentX(),
    );
    this.camera.aspect = camParams.aspect;
    this.camera.fov = camParams.fov;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.emitMetrics();
  }

  public setLevelTheme(levelId: number): void {
    const theme = getLevelTheme(levelId);
    this.currentTheme = theme;

    (this.scene.background as THREE.Color).setHex(theme.skyColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(theme.fogColor);
      this.scene.fog.density = theme.fogDensity;
    }

    this.hemiLight.color.setHex(theme.ambientSkyColor);
    this.hemiLight.groundColor.setHex(theme.ambientGroundColor);
    this.keyLight.color.setHex(theme.keyLightColor);
    this.rimLight.color.setHex(theme.laneDividerColor);

    this.track.applyTheme(theme);
    this.loadLevelQuestions(levelId);
  }

  public setActiveLane(lane: LaneIndex): void {
    this.activeLane = lane;
    this.track.setHighlightedLane(lane);
    this.robot.setLane(lane);
  }

  public getRobot(): Robot {
    return this.robot;
  }

  public setRobotAnimation(state: RobotAnimationState): void {
    this.robot.setAnimationState(state);
  }

  public triggerRobotReaction(
    type: 'celebrate' | 'incorrect' | 'victory' | 'defeat',
    durationSeconds = 1.4,
  ): void {
    this.robot.triggerReaction(type, durationSeconds);
    if (type === 'celebrate' || type === 'victory') {
      this.emitSparkles(this.robot.getCurrentX(), 1.5, ROBOT_DEFAULT_Z, 'correct');
    }
  }

  public setCameraPreset(preset: CameraPreset): void {
    this.cameraPreset = preset;
    this.emitMetrics();
  }

  public setRunning(running: boolean): void {
    this.isRunning = running;
    this.robot.setAnimationState(running ? 'run' : 'idle');
  }

  public setTrackSpeed(speed: number): void {
    this.trackSpeed = Math.max(0, Math.min(speed, 40));
  }

  private emitMetrics(): void {
    if (!this.onMetricsUpdate) return;
    const width = Math.max(this.container.clientWidth || window.innerWidth, 1);
    const height = Math.max(this.container.clientHeight || window.innerHeight, 1);
    const camParams = computeResponsiveCameraParams(
      width,
      height,
      this.cameraPreset,
      getLaneX(this.activeLane),
    );
    this.onMetricsUpdate({
      width,
      height,
      aspect: Number(camParams.aspect.toFixed(2)),
      isPortraitMobile: camParams.isPortraitMobile,
      effectiveFov: Math.round(camParams.fov),
      fps: this.currentFps,
      isSoftwareGl: this.isSoftwareGl,
    });
  }

  private afterDraw = (cb: () => void): void => {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  };

  private tick = (): void => {
    if (this.isDisposed) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.fpsFrameCount++;
    this.fpsAccumTime += delta;
    if (this.fpsAccumTime >= 0.75) {
      this.currentFps = Math.max(1, Math.round(this.fpsFrameCount / this.fpsAccumTime));
      this.fpsFrameCount = 0;
      this.fpsAccumTime = 0;
      this.emitMetrics();
    }

    const effectiveSpeed = this.isRunning ? this.trackSpeed : 0;
    this.track.update(delta, effectiveSpeed);
    this.robot.update(delta, effectiveSpeed);
    this.updateParticles(delta);

    if (this.activeGate) {
      const triggerResult = this.activeGate.update(
        delta,
        effectiveSpeed,
        this.robot.getLane(),
        ROBOT_DEFAULT_Z,
      );

      if (triggerResult) {
        this.robot.triggerReaction(
          triggerResult.isCorrect ? 'celebrate' : 'incorrect',
          1.35,
        );
        this.emitSparkles(
          getLaneX(triggerResult.selectedLane),
          1.5,
          ROBOT_DEFAULT_Z,
          triggerResult.isCorrect ? 'correct' : 'gate',
        );
        this.onGateResolved?.(triggerResult);
      }

      if (this.activeGate.isPastCleanupLine()) {
        this.advanceToNextGate();
      }
    }

    const width = Math.max(this.container.clientWidth || window.innerWidth, 1);
    const height = Math.max(this.container.clientHeight || window.innerHeight, 1);
    const camGoal = computeResponsiveCameraParams(
      width,
      height,
      this.cameraPreset,
      this.robot.getCurrentX(),
    );

    _camTargetPos.set(...camGoal.targetPosition);
    _camLookAtGoal.set(...camGoal.lookAtTarget);

    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      _camTargetPos.x,
      7,
      delta,
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      _camTargetPos.y,
      6,
      delta,
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      _camTargetPos.z,
      6,
      delta,
    );

    if (Math.abs(this.camera.fov - camGoal.fov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, camGoal.fov, 8, delta);
      this.camera.updateProjectionMatrix();
    }

    this.currentLookAt.x = THREE.MathUtils.damp(
      this.currentLookAt.x,
      _camLookAtGoal.x,
      8,
      delta,
    );
    this.currentLookAt.y = THREE.MathUtils.damp(
      this.currentLookAt.y,
      _camLookAtGoal.y,
      8,
      delta,
    );
    this.currentLookAt.z = THREE.MathUtils.damp(
      this.currentLookAt.z,
      _camLookAtGoal.z,
      8,
      delta,
    );
    this.camera.lookAt(this.currentLookAt);

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private startLoop(): void {
    this.stopLoop();
    this.clock.start();
    this.frameId = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
      this.frameId = 0;
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    this.stopLoop();
    window.removeEventListener('resize', this.onWindowResize);

    const domCanvas = this.renderer.domElement;
    domCanvas.removeEventListener('webglcontextlost', this.handleContextLost);
    domCanvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    if (this.activeGate) {
      this.scene.remove(this.activeGate.group);
      this.activeGate.dispose();
      this.activeGate = null;
    }

    if (this.sparkles) {
      this.scene.remove(this.sparkles.points);
      this.sparkles.dispose();
    }

    this.robot.dispose();
    this.track.dispose();
    this.envTexture?.dispose();
    this.renderer.dispose();

    if (domCanvas.parentNode === this.container) {
      this.container.removeChild(domCanvas);
    }
  }
}
