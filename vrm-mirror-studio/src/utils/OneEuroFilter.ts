export class OneEuroFilter {
  private freq: number;
  private mincutoff: number;
  private beta: number;
  private dcutoff: number;
  private x: LowPassFilter;
  private dx: LowPassFilter;
  private lasttime: number;

  constructor(freq: number, mincutoff = 1.0, beta = 0.0, dcutoff = 1.0) {
    this.freq = freq;
    this.mincutoff = mincutoff;
    this.beta = beta;
    this.dcutoff = dcutoff;
    this.x = new LowPassFilter(this.alpha(mincutoff));
    this.dx = new LowPassFilter(this.alpha(dcutoff));
    this.lasttime = 0;
  }

  private alpha(cutoff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  public filter(x: number, timestamp?: number): number {
    // Update the sampling frequency based on timestamps
    if (this.lasttime && timestamp) {
      this.freq = 1.0 / (timestamp - this.lasttime);
    }
    this.lasttime = timestamp || 0;

    // Estimate the current variation per second
    const dvalue = this.x.hasLastRawValue() ? (x - this.x.lastRawValue()) * this.freq : 0.0;
    const edvalue = this.dx.filterWithAlpha(dvalue, this.alpha(this.dcutoff));

    // Use it to update the cutoff frequency
    const cutoff = this.mincutoff + this.beta * Math.abs(edvalue);

    // Filter the given value
    return this.x.filterWithAlpha(x, this.alpha(cutoff));
  }
}

class LowPassFilter {
  private alpha: number;
  private y: number;
  private s: number;
  private initialized: boolean;

  constructor(alpha: number) {
    this.alpha = alpha;
    this.y = 0;
    this.s = 0;
    this.initialized = false;
  }

  public filterWithAlpha(value: number, alpha: number): number {
    if (this.initialized) {
      this.y = alpha * value + (1.0 - alpha) * this.y;
    } else {
      this.y = value;
      this.initialized = true;
    }
    return this.y;
  }

  public hasLastRawValue(): boolean {
    return this.initialized;
  }

  public lastRawValue(): number {
    return this.s;
  }

  public filter(value: number): number {
    this.s = value;
    return this.filterWithAlpha(value, this.alpha);
  }
}

// Vector3 version for 3D coordinates
export class OneEuroFilterVector3 {
  private x: OneEuroFilter;
  private y: OneEuroFilter;
  private z: OneEuroFilter;

  constructor(freq: number, mincutoff = 1.0, beta = 0.0, dcutoff = 1.0) {
    this.x = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
    this.y = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
    this.z = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
  }

  public filter(vector: { x: number; y: number; z: number }, timestamp?: number): { x: number; y: number; z: number } {
    return {
      x: this.x.filter(vector.x, timestamp),
      y: this.y.filter(vector.y, timestamp),
      z: this.z.filter(vector.z, timestamp),
    };
  }
}

// Quaternion version for rotations
export class OneEuroFilterQuaternion {
  private x: OneEuroFilter;
  private y: OneEuroFilter;
  private z: OneEuroFilter;
  private w: OneEuroFilter;

  constructor(freq: number, mincutoff = 1.0, beta = 0.0, dcutoff = 1.0) {
    this.x = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
    this.y = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
    this.z = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
    this.w = new OneEuroFilter(freq, mincutoff, beta, dcutoff);
  }

  public filter(quaternion: { x: number; y: number; z: number; w: number }, timestamp?: number): { x: number; y: number; z: number; w: number } {
    return {
      x: this.x.filter(quaternion.x, timestamp),
      y: this.y.filter(quaternion.y, timestamp),
      z: this.z.filter(quaternion.z, timestamp),
      w: this.w.filter(quaternion.w, timestamp),
    };
  }
}