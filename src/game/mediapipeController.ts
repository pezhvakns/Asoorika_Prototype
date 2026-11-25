import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

export type WebcamStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'permission-denied'
  | 'unavailable'
  | 'error';

export interface GestureSnapshot {
  leftFist: boolean;
  rightFist: boolean;
  leftDetected: boolean;
  rightDetected: boolean;
  status: WebcamStatus;
  errorMessage?: string;
}

export interface MediaPipeCallbacks {
  onJump: () => void;
  onHeadbutt: () => void;
  onStatusChange: (snapshot: GestureSnapshot) => void;
}

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Classifies whether a 21-point MediaPipe hand landmark set is a clenched fist.
 * A finger is curled when its tip is closer to the wrist (0) than its PIP joint.
 */
export function isFistGesture(landmarks: NormalizedLandmark[]): boolean {
  if (landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const fingerPairs: Array<[number, number]> = [
    [8, 6],   // Index tip vs PIP
    [12, 10], // Middle tip vs PIP
    [16, 14], // Ring tip vs PIP
    [20, 18], // Pinky tip vs PIP
  ];

  let curledCount = 0;
  for (const [tipIdx, pipIdx] of fingerPairs) {
    const tipDist = dist2D(landmarks[tipIdx], wrist);
    const pipDist = dist2D(landmarks[pipIdx], wrist);
    if (tipDist < pipDist * 1.06) {
      curledCount += 1;
    }
  }
  return curledCount >= 3;
}

export class MediaPipeHandController {
  private landmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private rafId: number | null = null;
  private lastVideoTime = -1;
  private prevLeftFist = false;
  private prevRightFist = false;
  private running = false;
  private callbacks: MediaPipeCallbacks;

  constructor(callbacks: MediaPipeCallbacks) {
    this.callbacks = callbacks;
  }

  public attachElements(
    videoEl: HTMLVideoElement | null,
    overlayCanvas: HTMLCanvasElement | null
  ): void {
    this.videoEl = videoEl;
    this.overlayCanvas = overlayCanvas;
    if (this.videoEl && this.stream && this.videoEl.srcObject !== this.stream) {
      this.videoEl.srcObject = this.stream;
      this.videoEl.play().catch(() => {});
    }
  }

  public async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    this.callbacks.onStatusChange({
      leftFist: false,
      rightFist: false,
      leftDetected: false,
      rightDetected: false,
      status: 'loading',
    });

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      this.running = false;
      this.callbacks.onStatusChange({
        leftFist: false,
        rightFist: false,
        leftDetected: false,
        rightDetected: false,
        status: 'unavailable',
        errorMessage: 'Camera is unavailable in this browser. Keyboard controls remain active.',
      });
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
    } catch (err) {
      this.running = false;
      const msg = err instanceof Error ? err.message : 'Camera permission denied';
      this.callbacks.onStatusChange({
        leftFist: false,
        rightFist: false,
        leftDetected: false,
        rightDetected: false,
        status: 'permission-denied',
        errorMessage: `Webcam access not granted (${msg}). You can still use Space & E.`,
      });
      return;
    }

    if (!this.running) {
      this.stopStream();
      return;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = this.stream;
      await this.videoEl.play().catch(() => {});
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
      });
    } catch {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
        );
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.5,
        });
      } catch {
        this.running = false;
        this.stopStream();
        this.callbacks.onStatusChange({
          leftFist: false,
          rightFist: false,
          leftDetected: false,
          rightDetected: false,
          status: 'error',
          errorMessage: 'MediaPipe model could not load offline. Keyboard Space & E remain active.',
        });
        return;
      }
    }

    if (!this.running) {
      this.stop();
      return;
    }

    this.callbacks.onStatusChange({
      leftFist: false,
      rightFist: false,
      leftDetected: false,
      rightDetected: false,
      status: 'ready',
    });

    this.loop();
  }

  private loop = (): void => {
    if (!this.running) return;

    const video = this.videoEl;
    if (video && this.landmarker && video.readyState >= 2) {
      if (video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = video.currentTime;
        const result = this.landmarker.detectForVideo(video, performance.now());

        let leftFist = false;
        let rightFist = false;
        let leftDetected = false;
        let rightDetected = false;

        const hands = result.landmarks ?? [];
        const handednessList = result.handednesses ?? [];

        this.drawOverlay(hands, handednessList);

        for (let i = 0; i < hands.length; i++) {
          const lm = hands[i];
          const label = handednessList[i]?.[0]?.categoryName ?? '';
          const fist = isFistGesture(lm);

          // In front-facing un-mirrored camera frames, MediaPipe's "Right" corresponds
          // to the user's physical Left hand (and vice versa).
          if (label === 'Right') {
            leftDetected = true;
            leftFist = leftFist || fist;
          } else if (label === 'Left') {
            rightDetected = true;
            rightFist = rightFist || fist;
          }
        }

        // Edge-trigger gestures: open -> fist fires once
        if (leftFist && !this.prevLeftFist) {
          this.callbacks.onJump();
        }
        if (rightFist && !this.prevRightFist) {
          this.callbacks.onHeadbutt();
        }

        if (
          leftFist !== this.prevLeftFist ||
          rightFist !== this.prevRightFist
        ) {
          this.callbacks.onStatusChange({
            leftFist,
            rightFist,
            leftDetected,
            rightDetected,
            status: 'ready',
          });
        }

        this.prevLeftFist = leftFist;
        this.prevRightFist = rightFist;
      }
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private drawOverlay(
    hands: NormalizedLandmark[][],
    handednessList: Array<Array<{ categoryName?: string }>>
  ): void {
    const canvas = this.overlayCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < hands.length; i++) {
      const lm = hands[i];
      const fist = isFistGesture(lm);
      const label = handednessList[i]?.[0]?.categoryName ?? '';
      const isPhysicalLeft = label === 'Right';
      const strokeColor = fist
        ? isPhysicalLeft
          ? '#38BDF8'
          : '#F59E0B'
        : '#F6E4CE';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      for (const [a, b] of HAND_CONNECTIONS) {
        const pa = lm[a];
        const pb = lm[b];
        if (!pa || !pb) continue;
        // Mirror horizontally to match mirrored webcam preview
        ctx.beginPath();
        ctx.moveTo((1 - pa.x) * w, pa.y * h);
        ctx.lineTo((1 - pb.x) * w, pb.y * h);
        ctx.stroke();
      }

      ctx.fillStyle = strokeColor;
      for (const pt of lm) {
        ctx.beginPath();
        ctx.arc((1 - pt.x) * w, pt.y * h, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private stopStream(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.stopStream();
    this.landmarker?.close();
    this.landmarker = null;
    this.prevLeftFist = false;
    this.prevRightFist = false;
  }
}
