import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

// Mirror mapping for bones (left <-> right)
const MIRROR_BONE_MAP: Record<string, string> = {
  'leftShoulder': 'rightShoulder',
  'rightShoulder': 'leftShoulder',
  'leftUpperArm': 'rightUpperArm',
  'rightUpperArm': 'leftUpperArm',
  'leftLowerArm': 'rightLowerArm',
  'rightLowerArm': 'leftLowerArm',
  'leftHand': 'rightHand',
  'rightHand': 'leftHand',
  'leftUpperLeg': 'rightUpperLeg',
  'rightUpperLeg': 'leftUpperLeg',
  'leftLowerLeg': 'rightLowerLeg',
  'rightLowerLeg': 'leftLowerLeg',
  'leftFoot': 'rightFoot',
  'rightFoot': 'leftFoot',
  'leftToes': 'rightToes',
  'rightToes': 'leftToes',
  // Fingers
  'leftThumbProximal': 'rightThumbProximal',
  'rightThumbProximal': 'leftThumbProximal',
  'leftThumbIntermediate': 'rightThumbIntermediate',
  'rightThumbIntermediate': 'leftThumbIntermediate',
  'leftThumbDistal': 'rightThumbDistal',
  'rightThumbDistal': 'leftThumbDistal',
  'leftIndexProximal': 'rightIndexProximal',
  'rightIndexProximal': 'leftIndexProximal',
  'leftIndexIntermediate': 'rightIndexIntermediate',
  'rightIndexIntermediate': 'leftIndexIntermediate',
  'leftIndexDistal': 'rightIndexDistal',
  'rightIndexDistal': 'leftIndexDistal',
  'leftMiddleProximal': 'rightMiddleProximal',
  'rightMiddleProximal': 'leftMiddleProximal',
  'leftMiddleIntermediate': 'rightMiddleIntermediate',
  'rightMiddleIntermediate': 'leftMiddleIntermediate',
  'leftMiddleDistal': 'rightMiddleDistal',
  'rightMiddleDistal': 'leftMiddleDistal',
  'leftRingProximal': 'rightRingProximal',
  'rightRingProximal': 'leftRingProximal',
  'leftRingIntermediate': 'rightRingIntermediate',
  'rightRingIntermediate': 'leftRingIntermediate',
  'leftRingDistal': 'rightRingDistal',
  'rightRingDistal': 'leftRingDistal',
  'leftLittleProximal': 'rightLittleProximal',
  'rightLittleProximal': 'leftLittleProximal',
  'leftLittleIntermediate': 'rightLittleIntermediate',
  'rightLittleIntermediate': 'leftLittleIntermediate',
  'leftLittleDistal': 'rightLittleDistal',
  'rightLittleDistal': 'leftLittleDistal',
};

// MediaPipe landmark indices
export const POSE_LANDMARKS = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

export class VRMAnimator {
  private vrm: VRM;
  private tempQuaternion = new THREE.Quaternion();
  private tempEuler = new THREE.Euler();
  private smoothingFactor = 0.3;

  constructor(vrm: VRM) {
    this.vrm = vrm;
  }

  // Apply full body tracking with mirror effect
  applyPoseTracking(landmarks: any[], visibility: number[] = []) {
    if (!this.vrm.humanoid) return;

    // Calculate bone rotations from landmarks
    this.updateSpine(landmarks);
    this.updateArms(landmarks, visibility);
    this.updateLegs(landmarks, visibility);
    this.updateHead(landmarks);
  }

  private updateSpine(landmarks: any[]) {
    const leftShoulder = landmarks[POSE_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[POSE_LANDMARKS.rightShoulder];
    const leftHip = landmarks[POSE_LANDMARKS.leftHip];
    const rightHip = landmarks[POSE_LANDMARKS.rightHip];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    // Calculate spine rotation
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2,
    };

    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: (leftHip.z + rightHip.z) / 2,
    };

    // Apply to spine bone
    const spine = this.vrm.humanoid.getNormalizedBoneNode('spine');
    if (spine) {
      const angle = Math.atan2(
        shoulderCenter.x - hipCenter.x,
        shoulderCenter.y - hipCenter.y
      );
      this.setRotationWithSmoothing(spine, 0, 0, -angle * 0.5);
    }
  }

  private updateArms(landmarks: any[], visibility: number[]) {
    // Update left arm (mapped to right in mirror)
    this.updateArm(
      landmarks[POSE_LANDMARKS.rightShoulder],
      landmarks[POSE_LANDMARKS.rightElbow],
      landmarks[POSE_LANDMARKS.rightWrist],
      'left', // Mirror: right landmarks -> left VRM bones
      visibility[POSE_LANDMARKS.rightShoulder] || 0
    );

    // Update right arm (mapped to left in mirror)
    this.updateArm(
      landmarks[POSE_LANDMARKS.leftShoulder],
      landmarks[POSE_LANDMARKS.leftElbow],
      landmarks[POSE_LANDMARKS.leftWrist],
      'right', // Mirror: left landmarks -> right VRM bones
      visibility[POSE_LANDMARKS.leftShoulder] || 0
    );
  }

  private updateArm(
    shoulder: any,
    elbow: any,
    wrist: any,
    side: 'left' | 'right',
    visibility: number
  ) {
    if (!shoulder || !elbow || !wrist || visibility < 0.5) return;

    const upperArmBone = this.vrm.humanoid?.getNormalizedBoneNode(
      `${side}UpperArm` as VRMHumanBoneName
    );
    const lowerArmBone = this.vrm.humanoid?.getNormalizedBoneNode(
      `${side}LowerArm` as VRMHumanBoneName
    );

    if (upperArmBone) {
      // Calculate upper arm rotation
      const shoulderToElbow = {
        x: elbow.x - shoulder.x,
        y: elbow.y - shoulder.y,
        z: elbow.z - shoulder.z,
      };

      const upperArmAngleY = Math.atan2(shoulderToElbow.x, shoulderToElbow.y);
      const upperArmAngleZ = Math.atan2(shoulderToElbow.z, shoulderToElbow.y);

      this.setRotationWithSmoothing(
        upperArmBone,
        upperArmAngleZ * 0.8,
        upperArmAngleY * (side === 'left' ? -1 : 1),
        0
      );
    }

    if (lowerArmBone) {
      // Calculate elbow bend
      const elbowAngle = this.calculateElbowAngle(shoulder, elbow, wrist);
      this.setRotationWithSmoothing(
        lowerArmBone,
        0,
        elbowAngle * (side === 'left' ? 1 : -1),
        0
      );
    }
  }

  private updateLegs(landmarks: any[], visibility: number[]) {
    // Similar implementation for legs
    // TODO: Implement leg tracking
  }

  private updateHead(landmarks: any[]) {
    const nose = landmarks[POSE_LANDMARKS.nose];
    const leftEye = landmarks[POSE_LANDMARKS.leftEye];
    const rightEye = landmarks[POSE_LANDMARKS.rightEye];

    if (!nose || !leftEye || !rightEye) return;

    const head = this.vrm.humanoid?.getNormalizedBoneNode('head');
    if (head) {
      // Calculate head rotation
      const eyeCenter = {
        x: (leftEye.x + rightEye.x) / 2,
        y: (leftEye.y + rightEye.y) / 2,
      };

      const headAngleY = (nose.x - eyeCenter.x) * 2;
      const headAngleX = (nose.y - eyeCenter.y) * -1.5;

      this.setRotationWithSmoothing(head, headAngleX, -headAngleY, 0);
    }
  }

  // Apply face tracking for blend shapes
  applyFaceTracking(faceLandmarks: any[]) {
    if (!this.vrm.expressionManager) return;

    // Eye tracking
    const leftEyeOpen = this.calculateEyeOpenRatio(faceLandmarks, 'left');
    const rightEyeOpen = this.calculateEyeOpenRatio(faceLandmarks, 'right');
    
    this.vrm.expressionManager.setValue('blinkLeft', 1 - leftEyeOpen);
    this.vrm.expressionManager.setValue('blinkRight', 1 - rightEyeOpen);

    // Mouth tracking
    const mouthOpen = this.calculateMouthOpenRatio(faceLandmarks);
    this.vrm.expressionManager.setValue('aa', mouthOpen);

    // Eyebrow tracking
    const leftBrowUp = this.calculateEyebrowRaise(faceLandmarks, 'left');
    const rightBrowUp = this.calculateEyebrowRaise(faceLandmarks, 'right');
    
    this.vrm.expressionManager.setValue('surprised', (leftBrowUp + rightBrowUp) / 2);
  }

  // Apply hand tracking with finger detail
  applyHandTracking(handLandmarks: any[], side: 'left' | 'right') {
    if (!this.vrm.humanoid) return;

    // Mirror the side for mirror effect
    const vrmSide = side === 'left' ? 'right' : 'left';

    // Update each finger
    this.updateFinger(handLandmarks, vrmSide, 'thumb', [1, 2, 3, 4]);
    this.updateFinger(handLandmarks, vrmSide, 'index', [5, 6, 7, 8]);
    this.updateFinger(handLandmarks, vrmSide, 'middle', [9, 10, 11, 12]);
    this.updateFinger(handLandmarks, vrmSide, 'ring', [13, 14, 15, 16]);
    this.updateFinger(handLandmarks, vrmSide, 'little', [17, 18, 19, 20]);
  }

  private updateFinger(
    handLandmarks: any[],
    side: 'left' | 'right',
    finger: string,
    indices: number[]
  ) {
    const proximal = this.vrm.humanoid?.getNormalizedBoneNode(
      `${side}${finger.charAt(0).toUpperCase() + finger.slice(1)}Proximal` as VRMHumanBoneName
    );
    const intermediate = this.vrm.humanoid?.getNormalizedBoneNode(
      `${side}${finger.charAt(0).toUpperCase() + finger.slice(1)}Intermediate` as VRMHumanBoneName
    );
    const distal = this.vrm.humanoid?.getNormalizedBoneNode(
      `${side}${finger.charAt(0).toUpperCase() + finger.slice(1)}Distal` as VRMHumanBoneName
    );

    // Calculate finger curl based on landmarks
    if (proximal && handLandmarks[indices[0]] && handLandmarks[indices[1]]) {
      const curl = this.calculateFingerCurl(
        handLandmarks[indices[0]],
        handLandmarks[indices[1]],
        handLandmarks[indices[2]],
        handLandmarks[indices[3]]
      );

      const curlAngle = curl * Math.PI / 3;
      this.setRotationWithSmoothing(proximal, 0, 0, curlAngle * 0.5);
      
      if (intermediate) {
        this.setRotationWithSmoothing(intermediate, 0, 0, curlAngle * 0.7);
      }
      
      if (distal) {
        this.setRotationWithSmoothing(distal, 0, 0, curlAngle * 0.3);
      }
    }
  }

  // Utility functions
  private calculateElbowAngle(shoulder: any, elbow: any, wrist: any): number {
    const v1 = {
      x: shoulder.x - elbow.x,
      y: shoulder.y - elbow.y,
      z: shoulder.z - elbow.z,
    };
    const v2 = {
      x: wrist.x - elbow.x,
      y: wrist.y - elbow.y,
      z: wrist.z - elbow.z,
    };

    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

    const angle = Math.acos(dot / (len1 * len2));
    return Math.PI - angle;
  }

  private calculateEyeOpenRatio(faceLandmarks: any[], side: 'left' | 'right'): number {
    // MediaPipe face landmark indices for eyes
    const eyeIndices = side === 'left' 
      ? { top: 159, bottom: 145, left: 33, right: 133 }
      : { top: 386, bottom: 374, left: 362, right: 263 };

    if (!faceLandmarks[eyeIndices.top] || !faceLandmarks[eyeIndices.bottom]) {
      return 1;
    }

    const eyeHeight = Math.abs(
      faceLandmarks[eyeIndices.top].y - faceLandmarks[eyeIndices.bottom].y
    );
    
    const eyeWidth = Math.abs(
      faceLandmarks[eyeIndices.left].x - faceLandmarks[eyeIndices.right].x
    );

    const ratio = eyeHeight / eyeWidth;
    return Math.min(1, Math.max(0, ratio * 4));
  }

  private calculateMouthOpenRatio(faceLandmarks: any[]): number {
    // MediaPipe indices for mouth
    const topLip = faceLandmarks[13];
    const bottomLip = faceLandmarks[14];
    const leftCorner = faceLandmarks[61];
    const rightCorner = faceLandmarks[291];

    if (!topLip || !bottomLip || !leftCorner || !rightCorner) {
      return 0;
    }

    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    const mouthWidth = Math.abs(leftCorner.x - rightCorner.x);

    const ratio = mouthHeight / mouthWidth;
    return Math.min(1, Math.max(0, ratio * 3));
  }

  private calculateEyebrowRaise(faceLandmarks: any[], side: 'left' | 'right'): number {
    // Simplified eyebrow raise calculation
    const browIndex = side === 'left' ? 70 : 300;
    const eyeIndex = side === 'left' ? 33 : 263;

    if (!faceLandmarks[browIndex] || !faceLandmarks[eyeIndex]) {
      return 0;
    }

    const distance = faceLandmarks[browIndex].y - faceLandmarks[eyeIndex].y;
    return Math.min(1, Math.max(0, distance * 5));
  }

  private calculateFingerCurl(base: any, joint1: any, joint2: any, tip: any): number {
    if (!base || !joint1 || !joint2 || !tip) return 0;

    // Calculate angles between segments
    const angle1 = this.angleBetweenPoints(base, joint1, joint2);
    const angle2 = this.angleBetweenPoints(joint1, joint2, tip);

    const totalCurl = (Math.PI - angle1) + (Math.PI - angle2);
    return Math.min(1, Math.max(0, totalCurl / (Math.PI * 2)));
  }

  private angleBetweenPoints(p1: any, p2: any, p3: any): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;

    return Math.atan2(det, dot);
  }

  private setRotationWithSmoothing(
    bone: THREE.Object3D,
    x: number,
    y: number,
    z: number
  ) {
    this.tempEuler.set(x, y, z);
    this.tempQuaternion.setFromEuler(this.tempEuler);
    
    bone.quaternion.slerp(this.tempQuaternion, this.smoothingFactor);
  }

  // Update smoothing factor
  setSmoothingFactor(factor: number) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }
}