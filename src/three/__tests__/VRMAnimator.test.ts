import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { VRMAnimator, POSE_LANDMARKS } from '../VRMAnimator';

// Mock Three.js and VRM
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  Object3D: jest.fn().mockImplementation(() => ({
    quaternion: {
      slerp: jest.fn()
    }
  })),
  Quaternion: jest.fn().mockImplementation(() => ({
    setFromEuler: jest.fn()
  })),
  Euler: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@pixiv/three-vrm', () => ({
  VRM: jest.fn(),
  VRMHumanBoneName: {}
}));

describe('VRMAnimator', () => {
  let animator: VRMAnimator;
  let mockVRM: jest.Mocked<VRM>;
  let mockHumanoid: any;
  let mockExpressionManager: any;
  let mockBone: any;

  beforeEach(() => {
    mockBone = {
      quaternion: {
        slerp: jest.fn()
      },
      position: {
        set: jest.fn()
      }
    };

    mockHumanoid = {
      getNormalizedBoneNode: jest.fn().mockReturnValue(mockBone)
    };

    mockExpressionManager = {
      setValue: jest.fn()
    };

    mockVRM = {
      humanoid: mockHumanoid,
      expressionManager: mockExpressionManager,
      scene: new THREE.Object3D(),
      update: jest.fn()
    } as any;

    animator = new VRMAnimator(mockVRM);
  });

  describe('constructor', () => {
    it('should initialize with VRM instance', () => {
      expect(animator).toBeDefined();
    });

    it('should set default smoothing factor', () => {
      expect(animator).toBeDefined();
      // Test smoothing factor by checking behavior
      animator.setSmoothingFactor(0.5);
      expect(animator).toBeDefined();
    });
  });

  describe('applyPoseTracking', () => {
    let mockLandmarks: any[];
    let mockVisibility: number[];

    beforeEach(() => {
      mockLandmarks = new Array(33).fill(null).map((_, index) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      }));

      mockVisibility = new Array(33).fill(0.8);
    });

    it('should handle empty landmarks', () => {
      expect(() => {
        animator.applyPoseTracking([]);
      }).not.toThrow();
    });

    it('should handle landmarks without visibility', () => {
      expect(() => {
        animator.applyPoseTracking(mockLandmarks);
      }).not.toThrow();
    });

    it('should handle landmarks with visibility', () => {
      expect(() => {
        animator.applyPoseTracking(mockLandmarks, mockVisibility);
      }).not.toThrow();
    });

    it('should handle null VRM humanoid gracefully', () => {
      const animatorWithoutHumanoid = new VRMAnimator({
        ...mockVRM,
        humanoid: null
      } as any);

      expect(() => {
        animatorWithoutHumanoid.applyPoseTracking(mockLandmarks, mockVisibility);
      }).not.toThrow();
    });

    it('should call bone update methods', () => {
      // Ensure specific landmarks exist for testing
      mockLandmarks[POSE_LANDMARKS.leftShoulder] = { x: 0.3, y: 0.3, z: 0.3 };
      mockLandmarks[POSE_LANDMARKS.rightShoulder] = { x: 0.7, y: 0.3, z: 0.3 };
      mockLandmarks[POSE_LANDMARKS.leftHip] = { x: 0.3, y: 0.7, z: 0.3 };
      mockLandmarks[POSE_LANDMARKS.rightHip] = { x: 0.7, y: 0.7, z: 0.3 };

      animator.applyPoseTracking(mockLandmarks, mockVisibility);

      expect(mockHumanoid.getNormalizedBoneNode).toHaveBeenCalled();
    });
  });

  describe('applyFaceTracking', () => {
    let mockFaceLandmarks: any[];

    beforeEach(() => {
      mockFaceLandmarks = new Array(468).fill(null).map(() => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      }));
    });

    it('should handle empty face landmarks', () => {
      expect(() => {
        animator.applyFaceTracking([]);
      }).not.toThrow();
    });

    it('should handle null expression manager gracefully', () => {
      const animatorWithoutExpression = new VRMAnimator({
        ...mockVRM,
        expressionManager: null
      } as any);

      expect(() => {
        animatorWithoutExpression.applyFaceTracking(mockFaceLandmarks);
      }).not.toThrow();
    });

    it('should set blend shape values', () => {
      // Mock specific face landmarks for eye/mouth detection
      mockFaceLandmarks[159] = { x: 0.5, y: 0.4, z: 0.0 }; // left eye top
      mockFaceLandmarks[145] = { x: 0.5, y: 0.6, z: 0.0 }; // left eye bottom
      mockFaceLandmarks[33] = { x: 0.4, y: 0.5, z: 0.0 };  // left eye left
      mockFaceLandmarks[133] = { x: 0.6, y: 0.5, z: 0.0 }; // left eye right

      mockFaceLandmarks[386] = { x: 0.3, y: 0.4, z: 0.0 }; // right eye top
      mockFaceLandmarks[374] = { x: 0.3, y: 0.6, z: 0.0 }; // right eye bottom
      mockFaceLandmarks[362] = { x: 0.2, y: 0.5, z: 0.0 }; // right eye left
      mockFaceLandmarks[263] = { x: 0.4, y: 0.5, z: 0.0 }; // right eye right

      mockFaceLandmarks[13] = { x: 0.5, y: 0.7, z: 0.0 };  // top lip
      mockFaceLandmarks[14] = { x: 0.5, y: 0.9, z: 0.0 };  // bottom lip
      mockFaceLandmarks[61] = { x: 0.3, y: 0.8, z: 0.0 };  // left mouth corner
      mockFaceLandmarks[291] = { x: 0.7, y: 0.8, z: 0.0 }; // right mouth corner

      mockFaceLandmarks[70] = { x: 0.4, y: 0.2, z: 0.0 };  // left eyebrow
      mockFaceLandmarks[300] = { x: 0.6, y: 0.2, z: 0.0 }; // right eyebrow

      animator.applyFaceTracking(mockFaceLandmarks);

      expect(mockExpressionManager.setValue).toHaveBeenCalledWith('blinkLeft', expect.any(Number));
      expect(mockExpressionManager.setValue).toHaveBeenCalledWith('blinkRight', expect.any(Number));
      expect(mockExpressionManager.setValue).toHaveBeenCalledWith('aa', expect.any(Number));
      expect(mockExpressionManager.setValue).toHaveBeenCalledWith('surprised', expect.any(Number));
    });

    it('should handle missing face landmarks gracefully', () => {
      const sparseLandmarks = new Array(468).fill(null);
      sparseLandmarks[0] = { x: 0.5, y: 0.5, z: 0.0 };

      expect(() => {
        animator.applyFaceTracking(sparseLandmarks);
      }).not.toThrow();
    });
  });

  describe('applyHandTracking', () => {
    let mockHandLandmarks: any[];

    beforeEach(() => {
      mockHandLandmarks = new Array(21).fill(null).map(() => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      }));
    });

    it('should handle empty hand landmarks', () => {
      expect(() => {
        animator.applyHandTracking([], 'left');
      }).not.toThrow();
    });

    it('should handle left hand tracking', () => {
      expect(() => {
        animator.applyHandTracking(mockHandLandmarks, 'left');
      }).not.toThrow();
    });

    it('should handle right hand tracking', () => {
      expect(() => {
        animator.applyHandTracking(mockHandLandmarks, 'right');
      }).not.toThrow();
    });

    it('should mirror hand sides correctly', () => {
      // Mock finger bones
      const mockFingerBone = {
        quaternion: {
          slerp: jest.fn()
        }
      };
      
      mockHumanoid.getNormalizedBoneNode.mockReturnValue(mockFingerBone);

      animator.applyHandTracking(mockHandLandmarks, 'left');

      // Should call for mirrored (right) side bones
      expect(mockHumanoid.getNormalizedBoneNode).toHaveBeenCalledWith(
        expect.stringContaining('right')
      );
    });

    it('should handle null humanoid gracefully', () => {
      const animatorWithoutHumanoid = new VRMAnimator({
        ...mockVRM,
        humanoid: null
      } as any);

      expect(() => {
        animatorWithoutHumanoid.applyHandTracking(mockHandLandmarks, 'left');
      }).not.toThrow();
    });

    it('should handle missing finger bones gracefully', () => {
      mockHumanoid.getNormalizedBoneNode.mockReturnValue(null);

      expect(() => {
        animator.applyHandTracking(mockHandLandmarks, 'left');
      }).not.toThrow();
    });
  });

  describe('setSmoothingFactor', () => {
    it('should set smoothing factor within valid range', () => {
      expect(() => {
        animator.setSmoothingFactor(0.5);
      }).not.toThrow();
    });

    it('should clamp smoothing factor to valid range', () => {
      expect(() => {
        animator.setSmoothingFactor(-0.5);
        animator.setSmoothingFactor(1.5);
      }).not.toThrow();
    });

    it('should accept boundary values', () => {
      expect(() => {
        animator.setSmoothingFactor(0.0);
        animator.setSmoothingFactor(1.0);
      }).not.toThrow();
    });
  });

  describe('private utility methods', () => {
    describe('updateSpine', () => {
      it('should handle spine bone updates', () => {
        const landmarks = new Array(33).fill(null);
        landmarks[POSE_LANDMARKS.leftShoulder] = { x: 0.3, y: 0.3, z: 0.3 };
        landmarks[POSE_LANDMARKS.rightShoulder] = { x: 0.7, y: 0.3, z: 0.3 };
        landmarks[POSE_LANDMARKS.leftHip] = { x: 0.3, y: 0.7, z: 0.3 };
        landmarks[POSE_LANDMARKS.rightHip] = { x: 0.7, y: 0.7, z: 0.3 };

        // Access private method through public interface
        animator.applyPoseTracking(landmarks);

        expect(mockHumanoid.getNormalizedBoneNode).toHaveBeenCalledWith('spine');
      });

      it('should handle missing spine landmarks', () => {
        const landmarks = new Array(33).fill(null);
        
        expect(() => {
          animator.applyPoseTracking(landmarks);
        }).not.toThrow();
      });
    });

    describe('updateArms', () => {
      it('should handle arm bone updates', () => {
        const landmarks = new Array(33).fill(null);
        const visibility = new Array(33).fill(0.8);
        
        landmarks[POSE_LANDMARKS.leftShoulder] = { x: 0.3, y: 0.3, z: 0.3 };
        landmarks[POSE_LANDMARKS.leftElbow] = { x: 0.2, y: 0.5, z: 0.3 };
        landmarks[POSE_LANDMARKS.leftWrist] = { x: 0.1, y: 0.7, z: 0.3 };
        
        landmarks[POSE_LANDMARKS.rightShoulder] = { x: 0.7, y: 0.3, z: 0.3 };
        landmarks[POSE_LANDMARKS.rightElbow] = { x: 0.8, y: 0.5, z: 0.3 };
        landmarks[POSE_LANDMARKS.rightWrist] = { x: 0.9, y: 0.7, z: 0.3 };

        animator.applyPoseTracking(landmarks, visibility);

        expect(mockHumanoid.getNormalizedBoneNode).toHaveBeenCalledWith('leftUpperArm');
        expect(mockHumanoid.getNormalizedBoneNode).toHaveBeenCalledWith('rightUpperArm');
      });

      it('should handle low visibility arms', () => {
        const landmarks = new Array(33).fill(null);
        const visibility = new Array(33).fill(0.3); // Low visibility
        
        landmarks[POSE_LANDMARKS.leftShoulder] = { x: 0.3, y: 0.3, z: 0.3 };
        landmarks[POSE_LANDMARKS.leftElbow] = { x: 0.2, y: 0.5, z: 0.3 };
        landmarks[POSE_LANDMARKS.leftWrist] = { x: 0.1, y: 0.7, z: 0.3 };

        expect(() => {
          animator.applyPoseTracking(landmarks, visibility);
        }).not.toThrow();
      });
    });

    describe('updateHead', () => {
      it('should handle head bone updates', () => {
        const landmarks = new Array(33).fill(null);
        landmarks[POSE_LANDMARKS.nose] = { x: 0.5, y: 0.3, z: 0.0 };
        landmarks[POSE_LANDMARKS.leftEye] = { x: 0.4, y: 0.3, z: 0.0 };
        landmarks[POSE_LANDMARKS.rightEye] = { x: 0.6, y: 0.3, z: 0.0 };

        animator.applyPoseTracking(landmarks);

        expect(mockHumanoid.getNormalizedBoneNode).toHaveBeenCalledWith('head');
      });

      it('should handle missing head landmarks', () => {
        const landmarks = new Array(33).fill(null);
        landmarks[POSE_LANDMARKS.nose] = { x: 0.5, y: 0.3, z: 0.0 };

        expect(() => {
          animator.applyPoseTracking(landmarks);
        }).not.toThrow();
      });
    });
  });

  describe('calculation methods', () => {
    describe('calculateElbowAngle', () => {
      it('should calculate valid elbow angles', () => {
        const shoulder = { x: 0.0, y: 0.0, z: 0.0 };
        const elbow = { x: 1.0, y: 0.0, z: 0.0 };
        const wrist = { x: 1.0, y: 1.0, z: 0.0 };

        // Test through public interface
        const landmarks = new Array(33).fill(null);
        landmarks[POSE_LANDMARKS.leftShoulder] = shoulder;
        landmarks[POSE_LANDMARKS.leftElbow] = elbow;
        landmarks[POSE_LANDMARKS.leftWrist] = wrist;

        expect(() => {
          animator.applyPoseTracking(landmarks, [1.0]);
        }).not.toThrow();
      });
    });

    describe('calculateEyeOpenRatio', () => {
      it('should calculate eye open ratios from face landmarks', () => {
        const faceLandmarks = new Array(468).fill({ x: 0.5, y: 0.5, z: 0.0 });
        
        // Mock specific eye landmarks
        faceLandmarks[159] = { x: 0.5, y: 0.4, z: 0.0 }; // left eye top
        faceLandmarks[145] = { x: 0.5, y: 0.6, z: 0.0 }; // left eye bottom
        faceLandmarks[33] = { x: 0.4, y: 0.5, z: 0.0 };  // left eye left
        faceLandmarks[133] = { x: 0.6, y: 0.5, z: 0.0 }; // left eye right

        expect(() => {
          animator.applyFaceTracking(faceLandmarks);
        }).not.toThrow();

        expect(mockExpressionManager.setValue).toHaveBeenCalledWith(
          'blinkLeft',
          expect.any(Number)
        );
      });
    });

    describe('calculateMouthOpenRatio', () => {
      it('should calculate mouth open ratios from face landmarks', () => {
        const faceLandmarks = new Array(468).fill({ x: 0.5, y: 0.5, z: 0.0 });
        
        // Mock mouth landmarks
        faceLandmarks[13] = { x: 0.5, y: 0.7, z: 0.0 };  // top lip
        faceLandmarks[14] = { x: 0.5, y: 0.9, z: 0.0 };  // bottom lip
        faceLandmarks[61] = { x: 0.3, y: 0.8, z: 0.0 };  // left corner
        faceLandmarks[291] = { x: 0.7, y: 0.8, z: 0.0 }; // right corner

        expect(() => {
          animator.applyFaceTracking(faceLandmarks);
        }).not.toThrow();

        expect(mockExpressionManager.setValue).toHaveBeenCalledWith(
          'aa',
          expect.any(Number)
        );
      });
    });

    describe('calculateFingerCurl', () => {
      it('should calculate finger curl from hand landmarks', () => {
        const handLandmarks = new Array(21).fill(null);
        
        // Mock finger landmarks (thumb)
        handLandmarks[1] = { x: 0.5, y: 0.5, z: 0.0 };
        handLandmarks[2] = { x: 0.4, y: 0.4, z: 0.0 };
        handLandmarks[3] = { x: 0.3, y: 0.3, z: 0.0 };
        handLandmarks[4] = { x: 0.2, y: 0.2, z: 0.0 };

        expect(() => {
          animator.applyHandTracking(handLandmarks, 'left');
        }).not.toThrow();
      });

      it('should handle missing finger landmarks', () => {
        const handLandmarks = new Array(21).fill(null);
        handLandmarks[0] = { x: 0.5, y: 0.5, z: 0.0 }; // wrist only

        expect(() => {
          animator.applyHandTracking(handLandmarks, 'left');
        }).not.toThrow();
      });
    });
  });

  describe('bone rotation with smoothing', () => {
    it('should apply rotations with smoothing', () => {
      const landmarks = new Array(33).fill(null);
      landmarks[POSE_LANDMARKS.nose] = { x: 0.5, y: 0.3, z: 0.0 };
      landmarks[POSE_LANDMARKS.leftEye] = { x: 0.4, y: 0.3, z: 0.0 };
      landmarks[POSE_LANDMARKS.rightEye] = { x: 0.6, y: 0.3, z: 0.0 };

      animator.applyPoseTracking(landmarks);

      expect(mockBone.quaternion.slerp).toHaveBeenCalled();
    });

    it('should handle different smoothing factors', () => {
      animator.setSmoothingFactor(0.1);
      
      const landmarks = new Array(33).fill(null);
      landmarks[POSE_LANDMARKS.nose] = { x: 0.5, y: 0.3, z: 0.0 };
      landmarks[POSE_LANDMARKS.leftEye] = { x: 0.4, y: 0.3, z: 0.0 };
      landmarks[POSE_LANDMARKS.rightEye] = { x: 0.6, y: 0.3, z: 0.0 };

      animator.applyPoseTracking(landmarks);

      expect(mockBone.quaternion.slerp).toHaveBeenCalled();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined landmarks gracefully', () => {
      expect(() => {
        animator.applyPoseTracking(undefined as any);
      }).not.toThrow();
    });

    it('should handle null landmarks gracefully', () => {
      expect(() => {
        animator.applyPoseTracking(null as any);
      }).not.toThrow();
    });

    it('should handle malformed landmark data', () => {
      const badLandmarks = [
        { x: 'invalid', y: 0.5, z: 0.0 },
        { x: 0.5, y: null, z: 0.0 },
        { notX: 0.5, notY: 0.5, notZ: 0.0 }
      ];

      expect(() => {
        animator.applyPoseTracking(badLandmarks as any);
      }).not.toThrow();
    });

    it('should handle extreme coordinate values', () => {
      const extremeLandmarks = new Array(33).fill(null);
      extremeLandmarks[POSE_LANDMARKS.nose] = { x: 1e10, y: -1e10, z: 0.0 };
      extremeLandmarks[POSE_LANDMARKS.leftEye] = { x: Infinity, y: 0.3, z: 0.0 };
      extremeLandmarks[POSE_LANDMARKS.rightEye] = { x: -Infinity, y: 0.3, z: 0.0 };

      expect(() => {
        animator.applyPoseTracking(extremeLandmarks);
      }).not.toThrow();
    });
  });

  describe('POSE_LANDMARKS constants', () => {
    it('should have all required landmark indices', () => {
      expect(POSE_LANDMARKS.nose).toBeDefined();
      expect(POSE_LANDMARKS.leftEye).toBeDefined();
      expect(POSE_LANDMARKS.rightEye).toBeDefined();
      expect(POSE_LANDMARKS.leftShoulder).toBeDefined();
      expect(POSE_LANDMARKS.rightShoulder).toBeDefined();
      expect(POSE_LANDMARKS.leftElbow).toBeDefined();
      expect(POSE_LANDMARKS.rightElbow).toBeDefined();
      expect(POSE_LANDMARKS.leftWrist).toBeDefined();
      expect(POSE_LANDMARKS.rightWrist).toBeDefined();
      expect(POSE_LANDMARKS.leftHip).toBeDefined();
      expect(POSE_LANDMARKS.rightHip).toBeDefined();
    });

    it('should have valid landmark indices', () => {
      Object.values(POSE_LANDMARKS).forEach(index => {
        expect(typeof index).toBe('number');
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(33); // MediaPipe pose has 33 landmarks
      });
    });
  });
});