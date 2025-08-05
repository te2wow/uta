export class OneEuroFilter {
  private x: number;
  private dx: number;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private lastTime: number;
  private initialized: boolean;

  constructor(minCutoff = 1.0, beta = 0.0, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.x = 0;
    this.dx = 0;
    this.lastTime = 0;
    this.initialized = false;
  }

  private alpha(cutoff: number, dt: number): number {
    const te = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + te / dt);
  }

  filter(value: number, timestamp?: number): number {
    const t = timestamp || Date.now() / 1000;
    
    if (!this.initialized) {
      this.initialized = true;
      this.x = value;
      this.dx = 0;
      this.lastTime = t;
      return value;
    }

    const dt = Math.max(t - this.lastTime, 0.001); // Minimum 1ms
    this.lastTime = t;

    // Estimate derivative
    const dx = (value - this.x) / dt;
    const edx = this.alpha(this.dCutoff, dt);
    this.dx = edx * dx + (1 - edx) * this.dx;

    // Filter signal
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = this.alpha(cutoff, dt);
    this.x = a * value + (1 - a) * this.x;

    return this.x;
  }

  reset() {
    this.initialized = false;
  }
}

// 3D version for position/rotation filtering
export class OneEuroFilter3D {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterZ: OneEuroFilter;

  constructor(minCutoff = 1.0, beta = 0.0, dCutoff = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  filter(x: number, y: number, z: number, timestamp?: number): [number, number, number] {
    return [
      this.filterX.filter(x, timestamp),
      this.filterY.filter(y, timestamp),
      this.filterZ.filter(z, timestamp)
    ];
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}

// Quaternion version for rotation filtering
export class OneEuroFilterQuaternion {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterZ: OneEuroFilter;
  private filterW: OneEuroFilter;

  constructor(minCutoff = 1.0, beta = 0.0, dCutoff = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterW = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  filter(x: number, y: number, z: number, w: number, timestamp?: number): [number, number, number, number] {
    return [
      this.filterX.filter(x, timestamp),
      this.filterY.filter(y, timestamp),
      this.filterZ.filter(z, timestamp),
      this.filterW.filter(w, timestamp)
    ];
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
    this.filterW.reset();
  }
}

// Landmark filtering for MediaPipe results
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export class LandmarkFilter {
  private filters: Map<string, OneEuroFilter3D>;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  constructor(minCutoff = 1.0, beta = 0.0, dCutoff = 1.0) {
    this.filters = new Map();
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  filterLandmarks(landmarks: Landmark[], timestamp?: number): Landmark[] {
    return landmarks.map((landmark, index) => {
      const key = `landmark_${index}`;
      
      if (!this.filters.has(key)) {
        this.filters.set(key, new OneEuroFilter3D(this.minCutoff, this.beta, this.dCutoff));
      }

      const filter = this.filters.get(key)!;
      const [x, y, z] = filter.filter(
        landmark.x,
        landmark.y,
        landmark.z || 0,
        timestamp
      );

      return {
        x,
        y,
        z,
        visibility: landmark.visibility
      };
    });
  }

  reset() {
    this.filters.clear();
  }
}

// EMA (Exponential Moving Average) filter as alternative
export class EMAFilter {
  private value: number;
  private alpha: number;
  private initialized: boolean;

  constructor(alpha = 0.5) {
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.value = 0;
    this.initialized = false;
  }

  filter(value: number): number {
    if (!this.initialized) {
      this.initialized = true;
      this.value = value;
      return value;
    }

    this.value = this.alpha * value + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset() {
    this.initialized = false;
  }

  setAlpha(alpha: number) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }
}

// 3D version of EMA filter
export class EMAFilter3D {
  private filterX: EMAFilter;
  private filterY: EMAFilter;
  private filterZ: EMAFilter;

  constructor(alpha = 0.5) {
    this.filterX = new EMAFilter(alpha);
    this.filterY = new EMAFilter(alpha);
    this.filterZ = new EMAFilter(alpha);
  }

  filter(x: number, y: number, z: number): [number, number, number] {
    return [
      this.filterX.filter(x),
      this.filterY.filter(y),
      this.filterZ.filter(z)
    ];
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }

  setAlpha(alpha: number) {
    this.filterX.setAlpha(alpha);
    this.filterY.setAlpha(alpha);
    this.filterZ.setAlpha(alpha);
  }
}