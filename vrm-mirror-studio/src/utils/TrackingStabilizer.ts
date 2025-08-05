import { OneEuroFilterVector3 } from './OneEuroFilter';
import type { TrackingResult } from '../services/MediaPipeService';

export interface StabilizedTrackingData {
  poseLandmarks?: Array<{ x: number; y: number; z: number }>;
  faceLandmarks?: Array<{ x: number; y: number; z: number }>;
  leftHandLandmarks?: Array<{ x: number; y: number; z: number }>;
  rightHandLandmarks?: Array<{ x: number; y: number; z: number }>;
}

export class TrackingStabilizer {
  private poseFilters: OneEuroFilterVector3[] = [];
  private faceFilters: OneEuroFilterVector3[] = [];
  private leftHandFilters: OneEuroFilterVector3[] = [];
  private rightHandFilters: OneEuroFilterVector3[] = [];
  
  private readonly freq = 30; // Expected fps
  private readonly mincutoff = 1.0;
  private readonly beta = 0.7; // Higher beta for more responsive tracking
  private readonly dcutoff = 1.0;

  constructor() {
    // Initialize filters for pose landmarks (33 points)
    for (let i = 0; i < 33; i++) {
      this.poseFilters.push(new OneEuroFilterVector3(this.freq, this.mincutoff, this.beta, this.dcutoff));
    }

    // Initialize filters for face landmarks (468 points)
    for (let i = 0; i < 468; i++) {
      this.faceFilters.push(new OneEuroFilterVector3(this.freq, this.mincutoff * 0.5, this.beta * 1.5, this.dcutoff));
    }

    // Initialize filters for hand landmarks (21 points each)
    for (let i = 0; i < 21; i++) {
      this.leftHandFilters.push(new OneEuroFilterVector3(this.freq, this.mincutoff, this.beta, this.dcutoff));
      this.rightHandFilters.push(new OneEuroFilterVector3(this.freq, this.mincutoff, this.beta, this.dcutoff));
    }
  }

  public stabilize(trackingData: TrackingResult, timestamp?: number): StabilizedTrackingData {
    const result: StabilizedTrackingData = {};

    // Stabilize pose landmarks
    if (trackingData.poseLandmarks) {
      result.poseLandmarks = trackingData.poseLandmarks.map((landmark, index) => {
        if (index < this.poseFilters.length) {
          return this.poseFilters[index].filter(landmark, timestamp);
        }
        return landmark;
      });
    }

    // Stabilize face landmarks
    if (trackingData.faceLandmarks) {
      result.faceLandmarks = trackingData.faceLandmarks.map((landmark, index) => {
        if (index < this.faceFilters.length) {
          return this.faceFilters[index].filter(landmark, timestamp);
        }
        return landmark;
      });
    }

    // Stabilize left hand landmarks
    if (trackingData.leftHandLandmarks) {
      result.leftHandLandmarks = trackingData.leftHandLandmarks.map((landmark, index) => {
        if (index < this.leftHandFilters.length) {
          return this.leftHandFilters[index].filter(landmark, timestamp);
        }
        return landmark;
      });
    }

    // Stabilize right hand landmarks
    if (trackingData.rightHandLandmarks) {
      result.rightHandLandmarks = trackingData.rightHandLandmarks.map((landmark, index) => {
        if (index < this.rightHandFilters.length) {
          return this.rightHandFilters[index].filter(landmark, timestamp);
        }
        return landmark;
      });
    }

    return result;
  }

  // EMA (Exponential Moving Average) fallback for simpler smoothing
  public static emaSmooth(current: number, previous: number, alpha: number = 0.7): number {
    return alpha * current + (1 - alpha) * previous;
  }

  public static emaSmoothVector3(
    current: { x: number; y: number; z: number },
    previous: { x: number; y: number; z: number },
    alpha: number = 0.7
  ): { x: number; y: number; z: number } {
    return {
      x: TrackingStabilizer.emaSmooth(current.x, previous.x, alpha),
      y: TrackingStabilizer.emaSmooth(current.y, previous.y, alpha),
      z: TrackingStabilizer.emaSmooth(current.z, previous.z, alpha),
    };
  }
}

// Slerp interpolation for smooth quaternion transitions
export class QuaternionSlerp {
  public static slerp(
    qa: { x: number; y: number; z: number; w: number },
    qb: { x: number; y: number; z: number; w: number },
    t: number
  ): { x: number; y: number; z: number; w: number } {
    // Calculate dot product
    let dot = qa.x * qb.x + qa.y * qb.y + qa.z * qb.z + qa.w * qb.w;

    // If dot product is negative, slerp won't take the shorter path
    // Note that v1 and -v1 are equivalent when the represent rotations
    if (dot < 0.0) {
      qb = { x: -qb.x, y: -qb.y, z: -qb.z, w: -qb.w };
      dot = -dot;
    }

    // If the inputs are too close for comfort, linearly interpolate
    if (dot > 0.9995) {
      const result = {
        x: qa.x + t * (qb.x - qa.x),
        y: qa.y + t * (qb.y - qa.y),
        z: qa.z + t * (qb.z - qa.z),
        w: qa.w + t * (qb.w - qa.w),
      };
      return QuaternionSlerp.normalize(result);
    }

    // Calculate the half angle between the quaternions
    const theta_0 = Math.acos(Math.abs(dot));
    const sin_theta_0 = Math.sin(theta_0);
    const theta = theta_0 * t;
    const sin_theta = Math.sin(theta);

    const s0 = Math.cos(theta) - dot * sin_theta / sin_theta_0;
    const s1 = sin_theta / sin_theta_0;

    return {
      x: s0 * qa.x + s1 * qb.x,
      y: s0 * qa.y + s1 * qb.y,
      z: s0 * qa.z + s1 * qb.z,
      w: s0 * qa.w + s1 * qb.w,
    };
  }

  private static normalize(q: { x: number; y: number; z: number; w: number }): { x: number; y: number; z: number; w: number } {
    const length = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    if (length === 0) {
      return { x: 0, y: 0, z: 0, w: 1 };
    }
    return {
      x: q.x / length,
      y: q.y / length,
      z: q.z / length,
      w: q.w / length,
    };
  }
}