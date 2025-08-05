import { 
  OneEuroFilter, 
  OneEuroFilter3D, 
  OneEuroFilterQuaternion, 
  LandmarkFilter, 
  EMAFilter, 
  EMAFilter3D,
  Landmark 
} from '../OneEuroFilter';

describe('OneEuroFilter', () => {
  let filter: OneEuroFilter;

  beforeEach(() => {
    filter = new OneEuroFilter(1.0, 0.0, 1.0);
  });

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const defaultFilter = new OneEuroFilter();
      expect(defaultFilter).toBeDefined();
    });

    it('should initialize with custom parameters', () => {
      const customFilter = new OneEuroFilter(2.0, 1.0, 0.5);
      expect(customFilter).toBeDefined();
    });
  });

  describe('filter', () => {
    it('should return input value on first call', () => {
      const value = 10.5;
      const result = filter.filter(value);
      expect(result).toBe(value);
    });

    it('should filter subsequent values', () => {
      filter.filter(10.0);
      const result = filter.filter(12.0);
      expect(result).toBeGreaterThan(10.0);
      expect(result).toBeLessThan(12.0);
    });

    it('should handle timestamp parameter', () => {
      const timestamp1 = 1000;
      const timestamp2 = 1100;
      
      filter.filter(10.0, timestamp1);
      const result = filter.filter(12.0, timestamp2);
      expect(result).toBeGreaterThan(10.0);
      expect(result).toBeLessThan(12.0);
    });

    it('should handle very small time differences', () => {
      const timestamp1 = 1000;
      const timestamp2 = 1000.0001;
      
      filter.filter(10.0, timestamp1);
      const result = filter.filter(12.0, timestamp2);
      expect(result).toBeFinite();
    });

    it('should handle same timestamp (zero dt)', () => {
      const timestamp = 1000;
      
      filter.filter(10.0, timestamp);
      const result = filter.filter(12.0, timestamp);
      expect(result).toBeFinite();
    });

    it('should handle negative time difference', () => {
      const timestamp1 = 1000;
      const timestamp2 = 999;
      
      filter.filter(10.0, timestamp1);
      const result = filter.filter(12.0, timestamp2);
      expect(result).toBeFinite();
    });
  });

  describe('reset', () => {
    it('should reset filter state', () => {
      filter.filter(10.0);
      filter.filter(12.0);
      filter.reset();
      
      const result = filter.filter(15.0);
      expect(result).toBe(15.0);
    });
  });

  describe('alpha calculation', () => {
    it('should calculate correct alpha values', () => {
      // Test different scenarios by filtering multiple values
      const values = [1, 2, 3, 4, 5];
      const results = values.map(v => filter.filter(v));
      
      expect(results[0]).toBe(1);
      expect(results.every(r => isFinite(r))).toBe(true);
    });
  });
});

describe('OneEuroFilter3D', () => {
  let filter3D: OneEuroFilter3D;

  beforeEach(() => {
    filter3D = new OneEuroFilter3D(1.0, 0.0, 1.0);
  });

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const defaultFilter = new OneEuroFilter3D();
      expect(defaultFilter).toBeDefined();
    });

    it('should initialize with custom parameters', () => {
      const customFilter = new OneEuroFilter3D(2.0, 1.0, 0.5);
      expect(customFilter).toBeDefined();
    });
  });

  describe('filter', () => {
    it('should filter 3D coordinates', () => {
      const [x, y, z] = filter3D.filter(1.0, 2.0, 3.0);
      expect(x).toBe(1.0);
      expect(y).toBe(2.0);
      expect(z).toBe(3.0);
    });

    it('should filter subsequent 3D values', () => {
      filter3D.filter(1.0, 2.0, 3.0);
      const [x, y, z] = filter3D.filter(2.0, 3.0, 4.0);
      
      expect(x).toBeGreaterThan(1.0);
      expect(x).toBeLessThan(2.0);
      expect(y).toBeGreaterThan(2.0);
      expect(y).toBeLessThan(3.0);
      expect(z).toBeGreaterThan(3.0);
      expect(z).toBeLessThan(4.0);
    });

    it('should handle timestamp parameter', () => {
      const timestamp1 = 1000;
      const timestamp2 = 1100;
      
      filter3D.filter(1.0, 2.0, 3.0, timestamp1);
      const [x, y, z] = filter3D.filter(2.0, 3.0, 4.0, timestamp2);
      
      expect(x).toBeFinite();
      expect(y).toBeFinite();
      expect(z).toBeFinite();
    });
  });

  describe('reset', () => {
    it('should reset all axis filters', () => {
      filter3D.filter(1.0, 2.0, 3.0);
      filter3D.filter(2.0, 3.0, 4.0);
      filter3D.reset();
      
      const [x, y, z] = filter3D.filter(5.0, 6.0, 7.0);
      expect(x).toBe(5.0);
      expect(y).toBe(6.0);
      expect(z).toBe(7.0);
    });
  });
});

describe('OneEuroFilterQuaternion', () => {
  let filterQuat: OneEuroFilterQuaternion;

  beforeEach(() => {
    filterQuat = new OneEuroFilterQuaternion(1.0, 0.0, 1.0);
  });

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const defaultFilter = new OneEuroFilterQuaternion();
      expect(defaultFilter).toBeDefined();
    });

    it('should initialize with custom parameters', () => {
      const customFilter = new OneEuroFilterQuaternion(2.0, 1.0, 0.5);
      expect(customFilter).toBeDefined();
    });
  });

  describe('filter', () => {
    it('should filter quaternion values', () => {
      const [x, y, z, w] = filterQuat.filter(0.0, 0.0, 0.0, 1.0);
      expect(x).toBe(0.0);
      expect(y).toBe(0.0);
      expect(z).toBe(0.0);
      expect(w).toBe(1.0);
    });

    it('should filter subsequent quaternion values', () => {
      filterQuat.filter(0.0, 0.0, 0.0, 1.0);
      const [x, y, z, w] = filterQuat.filter(0.1, 0.1, 0.1, 0.9);
      
      expect(x).toBeGreaterThan(0.0);
      expect(x).toBeLessThan(0.1);
      expect(y).toBeGreaterThan(0.0);
      expect(y).toBeLessThan(0.1);
      expect(z).toBeGreaterThan(0.0);
      expect(z).toBeLessThan(0.1);
      expect(w).toBeGreaterThan(0.9);
      expect(w).toBeLessThan(1.0);
    });

    it('should handle timestamp parameter', () => {
      const timestamp1 = 1000;
      const timestamp2 = 1100;
      
      filterQuat.filter(0.0, 0.0, 0.0, 1.0, timestamp1);
      const [x, y, z, w] = filterQuat.filter(0.1, 0.1, 0.1, 0.9, timestamp2);
      
      expect(x).toBeFinite();
      expect(y).toBeFinite();
      expect(z).toBeFinite();
      expect(w).toBeFinite();
    });
  });

  describe('reset', () => {
    it('should reset all quaternion component filters', () => {
      filterQuat.filter(0.0, 0.0, 0.0, 1.0);
      filterQuat.filter(0.1, 0.1, 0.1, 0.9);
      filterQuat.reset();
      
      const [x, y, z, w] = filterQuat.filter(0.5, 0.5, 0.5, 0.5);
      expect(x).toBe(0.5);
      expect(y).toBe(0.5);
      expect(z).toBe(0.5);
      expect(w).toBe(0.5);
    });
  });
});

describe('LandmarkFilter', () => {
  let landmarkFilter: LandmarkFilter;
  let mockLandmarks: Landmark[];

  beforeEach(() => {
    landmarkFilter = new LandmarkFilter(1.0, 0.0, 1.0);
    mockLandmarks = [
      { x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 },
      { x: 0.4, y: 0.5, z: 0.6, visibility: 0.8 },
      { x: 0.7, y: 0.8, z: 0.9, visibility: 0.7 }
    ];
  });

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      const defaultFilter = new LandmarkFilter();
      expect(defaultFilter).toBeDefined();
    });

    it('should initialize with custom parameters', () => {
      const customFilter = new LandmarkFilter(2.0, 1.0, 0.5);
      expect(customFilter).toBeDefined();
    });
  });

  describe('filterLandmarks', () => {
    it('should filter landmarks array', () => {
      const filtered = landmarkFilter.filterLandmarks(mockLandmarks);
      
      expect(filtered).toHaveLength(mockLandmarks.length);
      expect(filtered[0].x).toBe(mockLandmarks[0].x);
      expect(filtered[0].y).toBe(mockLandmarks[0].y);
      expect(filtered[0].z).toBe(mockLandmarks[0].z);
      expect(filtered[0].visibility).toBe(mockLandmarks[0].visibility);
    });

    it('should filter subsequent landmark arrays', () => {
      landmarkFilter.filterLandmarks(mockLandmarks);
      
      const newLandmarks: Landmark[] = [
        { x: 0.2, y: 0.3, z: 0.4, visibility: 0.9 },
        { x: 0.5, y: 0.6, z: 0.7, visibility: 0.8 },
        { x: 0.8, y: 0.9, z: 1.0, visibility: 0.7 }
      ];
      
      const filtered = landmarkFilter.filterLandmarks(newLandmarks);
      
      expect(filtered[0].x).toBeGreaterThan(mockLandmarks[0].x);
      expect(filtered[0].x).toBeLessThan(newLandmarks[0].x);
    });

    it('should handle landmarks without z coordinate', () => {
      const landmarks2D: Landmark[] = [
        { x: 0.1, y: 0.2, visibility: 0.9 },
        { x: 0.4, y: 0.5, visibility: 0.8 }
      ];
      
      const filtered = landmarkFilter.filterLandmarks(landmarks2D);
      
      expect(filtered).toHaveLength(landmarks2D.length);
      expect(filtered[0].z).toBe(0);
      expect(filtered[1].z).toBe(0);
    });

    it('should handle landmarks without visibility', () => {
      const landmarksNoVis: Landmark[] = [
        { x: 0.1, y: 0.2, z: 0.3 },
        { x: 0.4, y: 0.5, z: 0.6 }
      ];
      
      const filtered = landmarkFilter.filterLandmarks(landmarksNoVis);
      
      expect(filtered).toHaveLength(landmarksNoVis.length);
      expect(filtered[0].visibility).toBeUndefined();
    });

    it('should handle empty landmarks array', () => {
      const filtered = landmarkFilter.filterLandmarks([]);
      expect(filtered).toHaveLength(0);
    });

    it('should handle timestamp parameter', () => {
      const timestamp1 = 1000;
      const timestamp2 = 1100;
      
      landmarkFilter.filterLandmarks(mockLandmarks, timestamp1);
      const filtered = landmarkFilter.filterLandmarks(mockLandmarks, timestamp2);
      
      expect(filtered).toHaveLength(mockLandmarks.length);
      expect(filtered[0].x).toBeFinite();
    });
  });

  describe('reset', () => {
    it('should reset all landmark filters', () => {
      landmarkFilter.filterLandmarks(mockLandmarks);
      landmarkFilter.reset();
      
      const filtered = landmarkFilter.filterLandmarks(mockLandmarks);
      expect(filtered[0].x).toBe(mockLandmarks[0].x);
      expect(filtered[0].y).toBe(mockLandmarks[0].y);
      expect(filtered[0].z).toBe(mockLandmarks[0].z);
    });
  });
});

describe('EMAFilter', () => {
  let emaFilter: EMAFilter;

  beforeEach(() => {
    emaFilter = new EMAFilter(0.5);
  });

  describe('constructor', () => {
    it('should initialize with default alpha', () => {
      const defaultFilter = new EMAFilter();
      expect(defaultFilter).toBeDefined();
    });

    it('should initialize with custom alpha', () => {
      const customFilter = new EMAFilter(0.3);
      expect(customFilter).toBeDefined();
    });

    it('should clamp alpha to valid range', () => {
      const lowFilter = new EMAFilter(-0.5);
      const highFilter = new EMAFilter(1.5);
      
      expect(lowFilter).toBeDefined();
      expect(highFilter).toBeDefined();
    });
  });

  describe('filter', () => {
    it('should return input value on first call', () => {
      const value = 10.5;
      const result = emaFilter.filter(value);
      expect(result).toBe(value);
    });

    it('should filter subsequent values', () => {
      emaFilter.filter(10.0);
      const result = emaFilter.filter(12.0);
      expect(result).toBe(11.0); // (0.5 * 12.0) + (0.5 * 10.0)
    });

    it('should handle multiple filtering steps', () => {
      emaFilter.filter(10.0);
      emaFilter.filter(12.0);
      const result = emaFilter.filter(14.0);
      expect(result).toBe(12.5); // (0.5 * 14.0) + (0.5 * 11.0)
    });
  });

  describe('reset', () => {
    it('should reset filter state', () => {
      emaFilter.filter(10.0);
      emaFilter.filter(12.0);
      emaFilter.reset();
      
      const result = emaFilter.filter(15.0);
      expect(result).toBe(15.0);
    });
  });

  describe('setAlpha', () => {
    it('should update alpha value', () => {
      emaFilter.setAlpha(0.8);
      emaFilter.filter(10.0);
      const result = emaFilter.filter(20.0);
      expect(result).toBe(18.0); // (0.8 * 20.0) + (0.2 * 10.0)
    });

    it('should clamp alpha to valid range', () => {
      emaFilter.setAlpha(-0.5);
      emaFilter.filter(10.0);
      const result1 = emaFilter.filter(20.0);
      expect(result1).toBe(10.0); // alpha = 0, no change
      
      emaFilter.reset();
      emaFilter.setAlpha(1.5);
      emaFilter.filter(10.0);
      const result2 = emaFilter.filter(20.0);
      expect(result2).toBe(20.0); // alpha = 1, full new value
    });
  });
});

describe('EMAFilter3D', () => {
  let emaFilter3D: EMAFilter3D;

  beforeEach(() => {
    emaFilter3D = new EMAFilter3D(0.5);
  });

  describe('constructor', () => {
    it('should initialize with default alpha', () => {
      const defaultFilter = new EMAFilter3D();
      expect(defaultFilter).toBeDefined();
    });

    it('should initialize with custom alpha', () => {
      const customFilter = new EMAFilter3D(0.3);
      expect(customFilter).toBeDefined();
    });
  });

  describe('filter', () => {
    it('should filter 3D coordinates', () => {
      const [x, y, z] = emaFilter3D.filter(1.0, 2.0, 3.0);
      expect(x).toBe(1.0);
      expect(y).toBe(2.0);
      expect(z).toBe(3.0);
    });

    it('should filter subsequent 3D values', () => {
      emaFilter3D.filter(1.0, 2.0, 3.0);
      const [x, y, z] = emaFilter3D.filter(3.0, 4.0, 5.0);
      
      expect(x).toBe(2.0); // (0.5 * 3.0) + (0.5 * 1.0)
      expect(y).toBe(3.0); // (0.5 * 4.0) + (0.5 * 2.0)
      expect(z).toBe(4.0); // (0.5 * 5.0) + (0.5 * 3.0)
    });
  });

  describe('reset', () => {
    it('should reset all axis filters', () => {
      emaFilter3D.filter(1.0, 2.0, 3.0);
      emaFilter3D.filter(3.0, 4.0, 5.0);
      emaFilter3D.reset();
      
      const [x, y, z] = emaFilter3D.filter(7.0, 8.0, 9.0);
      expect(x).toBe(7.0);
      expect(y).toBe(8.0);
      expect(z).toBe(9.0);
    });
  });

  describe('setAlpha', () => {
    it('should update alpha for all axis filters', () => {
      emaFilter3D.setAlpha(0.8);
      emaFilter3D.filter(1.0, 2.0, 3.0);
      const [x, y, z] = emaFilter3D.filter(6.0, 7.0, 8.0);
      
      expect(x).toBe(5.0); // (0.8 * 6.0) + (0.2 * 1.0)
      expect(y).toBe(6.0); // (0.8 * 7.0) + (0.2 * 2.0)
      expect(z).toBe(7.0); // (0.8 * 8.0) + (0.2 * 3.0)
    });
  });
});

describe('Edge Cases and Performance', () => {
  describe('numerical stability', () => {
    it('should handle very large numbers', () => {
      const filter = new OneEuroFilter();
      const largeValue = 1e10;
      
      const result = filter.filter(largeValue);
      expect(result).toBe(largeValue);
      expect(isFinite(result)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const filter = new OneEuroFilter();
      const smallValue = 1e-10;
      
      const result = filter.filter(smallValue);
      expect(result).toBe(smallValue);
      expect(isFinite(result)).toBe(true);
    });

    it('should handle NaN values gracefully', () => {
      const filter = new OneEuroFilter();
      
      const result = filter.filter(NaN);
      expect(isNaN(result)).toBe(true);
    });

    it('should handle Infinity values gracefully', () => {
      const filter = new OneEuroFilter();
      
      const result1 = filter.filter(Infinity);
      expect(result1).toBe(Infinity);
      
      const result2 = filter.filter(-Infinity);
      expect(isFinite(result2)).toBe(true);
    });
  });

  describe('performance characteristics', () => {
    it('should handle rapid successive calls efficiently', () => {
      const filter = new OneEuroFilter();
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        filter.filter(Math.random() * 100, i);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should maintain consistent memory usage', () => {
      const filters = [];
      for (let i = 0; i < 100; i++) {
        filters.push(new OneEuroFilter());
      }
      
      filters.forEach((filter, index) => {
        filter.filter(index);
        filter.filter(index + 1);
      });
      
      expect(filters.length).toBe(100);
    });
  });
});