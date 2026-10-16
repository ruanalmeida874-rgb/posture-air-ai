// Posture AI Engine — Real-time Computer Vision & Biometric Posture Telemetry
// Uses MediaPipe Tasks Vision (PoseLandmarker) with client-side WebGL acceleration.

import type { CalibrationBaseline, Profile, SessionTimelinePoint } from "./posture-store";

export type PostureFrame = {
  timestamp: number;
  pitch: number; // degrees forward (+) or back (-) relative to baseline
  roll: number; // degrees tilt left (-) or right (+) relative to baseline
  yaw: number; // rotation left (-) or right (+)
  shoulderSlope: number; // shoulder asymmetry in degrees
  forwardHeadDelta: number; // forward projection metric
  isSlouching: boolean;
  state: "good" | "warn" | "bad";
  score: number; // 0..100
  confidence: number;
  source: "camera" | "sensor" | "simulated";
  rawLandmarks?: Array<{ x: number; y: number; z: number }>;
};

// Internal smoothing state for EMA filter
let lastPitch = 0;
let lastRoll = 0;
let lastYaw = 0;
let lastShoulderSlope = 0;
let lastScore = 96;

let poseLandmarkerInstance: any = null;
let isInitializing = false;
let initFailed = false;

/**
 * Lazily loads and initializes MediaPipe PoseLandmarker in browser.
 */
export async function getPoseLandmarker() {
  if (typeof window === "undefined") return null;
  if (poseLandmarkerInstance) return poseLandmarkerInstance;
  if (initFailed) return null;
  if (isInitializing) {
    // Wait for in-flight init
    let attempts = 0;
    while (isInitializing && attempts < 30) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }
    return poseLandmarkerInstance;
  }

  isInitializing = true;
  try {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
    );

    poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return poseLandmarkerInstance;
  } catch (err) {
    console.warn("MediaPipe PoseLandmarker GPU initialization note:", err);
    try {
      // Try CPU fallback
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      );
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      return poseLandmarkerInstance;
    } catch (e2) {
      console.warn("MediaPipe PoseLandmarker CPU fallback note:", e2);
      initFailed = true;
      return null;
    }
  } finally {
    isInitializing = false;
  }
}

/**
 * Resets the smoothing filters when starting a new session or calibration.
 */
export function resetEngineState() {
  lastPitch = 0;
  lastRoll = 0;
  lastYaw = 0;
  lastShoulderSlope = 0;
  lastScore = 96;
}

/**
 * Processes a single video frame from camera, compares against the calibrated baseline,
 * and outputs real ergonomic posture telemetry.
 */
export function analyzeVideoFrame(
  video: HTMLVideoElement,
  landmarker: any,
  timestampMs: number,
  baseline: CalibrationBaseline,
  profile: Pick<Profile, "sensitivity">
): PostureFrame | null {
  if (!video || video.readyState < 2) return null;

  try {
    let result: any = null;
    if (landmarker && typeof landmarker.detectForVideo === "function") {
      result = landmarker.detectForVideo(video, timestampMs);
    }

    if (result && result.landmarks && result.landmarks.length > 0) {
      const lm = result.landmarks[0];

      // Key landmark indices (MediaPipe Pose):
      // 0: nose
      // 7: left_ear, 8: right_ear
      // 11: left_shoulder, 12: right_shoulder
      const nose = lm[0];
      const leftEar = lm[7];
      const rightEar = lm[8];
      const leftShoulder = lm[11];
      const rightShoulder = lm[12];

      if (!leftEar || !rightEar) return null;

      // 1. Roll: Lateral Head Tilt (angle between ears)
      const earDx = rightEar.x - leftEar.x;
      const earDy = rightEar.y - leftEar.y;
      const rawRoll = Math.atan2(earDy, earDx) * (180 / Math.PI);

      // 2. Yaw: Rotation Asymmetry
      const distL = Math.hypot(nose.x - leftEar.x, nose.y - leftEar.y);
      const distR = Math.hypot(nose.x - rightEar.x, nose.y - rightEar.y);
      const sumDist = distL + distR || 0.001;
      const rawYaw = ((distR - distL) / sumDist) * 45;

      // 3. Shoulder Slope:
      let rawShoulderSlope = 0;
      let rawEarShoulderDist = baseline.baselineEarShoulderDist || 0.18;
      if (leftShoulder && rightShoulder) {
        const shDx = rightShoulder.x - leftShoulder.x;
        const shDy = rightShoulder.y - leftShoulder.y;
        rawShoulderSlope = Math.atan2(shDy, shDx) * (180 / Math.PI);

        const avgEarY = (leftEar.y + rightEar.y) / 2;
        const avgShY = (leftShoulder.y + rightShoulder.y) / 2;
        rawEarShoulderDist = Math.max(0.05, avgShY - avgEarY);
      }

      // 4. Pitch: Forward Head Posture (relative vertical distance + z-depth)
      // When head goes forward, vertical distance between ear and shoulder compresses.
      const distRatio = baseline.baselineEarShoulderDist
        ? (baseline.baselineEarShoulderDist - rawEarShoulderDist) / baseline.baselineEarShoulderDist
        : 0;
      const rawPitch = distRatio * 38;

      // Exponential smoothing (alpha = 0.25)
      const alpha = 0.25;
      lastRoll = Number((alpha * rawRoll + (1 - alpha) * lastRoll).toFixed(1));
      lastYaw = Number((alpha * rawYaw + (1 - alpha) * lastYaw).toFixed(1));
      lastShoulderSlope = Number((alpha * rawShoulderSlope + (1 - alpha) * lastShoulderSlope).toFixed(1));
      lastPitch = Number((alpha * rawPitch + (1 - alpha) * lastPitch).toFixed(1));

      // Calculate deltas relative to user's calibrated baseline
      const deltaRoll = Math.abs(lastRoll - baseline.baselineRoll);
      const deltaPitch = lastPitch - baseline.baselinePitch;
      const deltaShoulder = Math.abs(lastShoulderSlope - baseline.baselineShoulderSlope);

      // Thresholds adapted to user sensitivity
      const mult = profile.sensitivity === "high" ? 0.75 : profile.sensitivity === "low" ? 1.35 : 1.0;
      const pitchThresholdWarn = 12 * mult;
      const pitchThresholdBad = 20 * mult;
      const rollThresholdWarn = 8 * mult;
      const rollThresholdBad = 15 * mult;

      let state: "good" | "warn" | "bad" = "good";
      if (deltaPitch > pitchThresholdBad || deltaRoll > rollThresholdBad || deltaShoulder > 14 * mult) {
        state = "bad";
      } else if (deltaPitch > pitchThresholdWarn || deltaRoll > rollThresholdWarn || deltaShoulder > 8 * mult) {
        state = "warn";
      }

      // Target score
      const targetScore = state === "good" ? 98 : state === "warn" ? 74 : 45;
      lastScore = Number((lastScore + (targetScore - lastScore) * 0.15).toFixed(1));

      return {
        timestamp: timestampMs,
        pitch: lastPitch,
        roll: lastRoll,
        yaw: lastYaw,
        shoulderSlope: lastShoulderSlope,
        forwardHeadDelta: Number(distRatio.toFixed(3)),
        isSlouching: deltaPitch > pitchThresholdWarn || deltaShoulder > 10,
        state,
        score: Math.max(0, Math.min(100, Math.round(lastScore))),
        confidence: 0.95,
        source: "camera",
        rawLandmarks: lm,
      };
    }
  } catch (err) {
    console.warn("Frame analysis error:", err);
  }

  return null;
}

/**
 * Draws visual posture guidelines (ears line, shoulders line, nose-center line) onto a canvas.
 */
export function drawPostureOverlay(
  canvas: HTMLCanvasElement,
  landmarks: Array<{ x: number; y: number; z: number }> | undefined,
  state: "good" | "warn" | "bad"
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!landmarks || landmarks.length === 0) return;

  const w = canvas.width;
  const h = canvas.height;

  const color =
    state === "good"
      ? "rgba(100, 240, 180, 0.85)"
      : state === "warn"
        ? "rgba(250, 204, 21, 0.85)"
        : "rgba(244, 63, 94, 0.9)";

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  // Draw ear line (horizontal head alignment)
  if (leftEar && rightEar) {
    ctx.beginPath();
    ctx.moveTo(leftEar.x * w, leftEar.y * h);
    ctx.lineTo(rightEar.x * w, rightEar.y * h);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftEar.x * w, leftEar.y * h, 5, 0, 2 * Math.PI);
    ctx.arc(rightEar.x * w, rightEar.y * h, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw shoulder line
  if (leftShoulder && rightShoulder) {
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x * w, leftShoulder.y * h);
    ctx.lineTo(rightShoulder.x * w, rightShoulder.y * h);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(leftShoulder.x * w, leftShoulder.y * h, 6, 0, 2 * Math.PI);
    ctx.arc(rightShoulder.x * w, rightShoulder.y * h, 6, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw central spinal axis from nose midpoint down to shoulders midpoint
  if (nose && leftShoulder && rightShoulder) {
    const midShX = ((leftShoulder.x + rightShoulder.x) / 2) * w;
    const midShY = ((leftShoulder.y + rightShoulder.y) / 2) * h;

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(nose.x * w, nose.y * h);
    ctx.lineTo(midShX, midShY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(nose.x * w, nose.y * h, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Analyzes session telemetry to generate a precise semantic diagnosis.
 */
export function generateSessionDiagnosis(timeline: SessionTimelinePoint[]): string {
  if (!timeline || timeline.length === 0) {
    return "Excelente alinhamento e consistência postural.";
  }

  const badPoints = timeline.filter((p) => p.state === "bad" || p.state === "warn");
  if (badPoints.length === 0) {
    return "Postura exemplar ao longo de toda a sessão! Coluna alinhada e cabeça estável.";
  }

  let forwardCount = 0;
  let lateralCount = 0;

  for (const p of badPoints) {
    if (p.tilt > 14) forwardCount++;
    if (p.roll && Math.abs(p.roll) > 10) lateralCount++;
  }

  if (forwardCount >= lateralCount && forwardCount > 2) {
    const avgSec = Math.round(
      badPoints.reduce((acc, b) => acc + b.t, 0) / badPoints.length
    );
    const min = Math.max(1, Math.round(avgSec / 60));
    return `Você tende a projetar a cabeça para frente após cerca de ${min} minuto${min > 1 ? "s" : ""}. Mantenha o queixo ligeiramente recolhido.`;
  }

  if (lateralCount > forwardCount && lateralCount > 2) {
    return "Inclinação lateral excessiva detectada. Verifique a altura do seu monitor e evite apoiar o queixo com as mãos.";
  }

  return "Pequenos desvios posturais pontuais corrigidos a tempo. Bom ritmo de atenção corporal.";
}
