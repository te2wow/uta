import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { BlendShapeWeights } from './MediaPipeService';
import type { StabilizedTrackingData } from '../utils/TrackingStabilizer';

export interface VRMBoneMapping {
  hips: THREE.Object3D | null;
  spine: THREE.Object3D | null;
  chest: THREE.Object3D | null;
  neck: THREE.Object3D | null;
  head: THREE.Object3D | null;
  leftShoulder: THREE.Object3D | null;
  leftUpperArm: THREE.Object3D | null;
  leftLowerArm: THREE.Object3D | null;
  leftHand: THREE.Object3D | null;
  rightShoulder: THREE.Object3D | null;
  rightUpperArm: THREE.Object3D | null;
  rightLowerArm: THREE.Object3D | null;
  rightHand: THREE.Object3D | null;
  leftUpperLeg: THREE.Object3D | null;
  leftLowerLeg: THREE.Object3D | null;
  leftFoot: THREE.Object3D | null;
  rightUpperLeg: THREE.Object3D | null;
  rightLowerLeg: THREE.Object3D | null;
  rightFoot: THREE.Object3D | null;
}

export class VRMService {
  private loader: GLTFLoader;
  private currentVRM: VRM | null = null;
  private scene: THREE.Scene | null = null;
  private bones: VRMBoneMapping = {} as VRMBoneMapping;
  private mirrorMode = true;

  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
  }

  public async loadVRM(file: File, scene: THREE.Scene): Promise<VRM> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      
      this.loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm as VRM;
          
          if (!vrm) {
            reject(new Error('Invalid VRM file'));
            return;
          }

          // Remove existing VRM
          if (this.currentVRM) {
            scene.remove(this.currentVRM.scene);
            // VRM disposal is handled by Three.js cleanup
          }

          // Add new VRM to scene
          scene.add(vrm.scene);
          
          // Store references
          this.currentVRM = vrm;
          this.scene = scene;
          
          // Map bones for easier access
          this.mapBones(vrm);
          
          // Set up model for tracking
          this.setupModelForTracking(vrm);
          
          URL.revokeObjectURL(url);
          resolve(vrm);
        },
        (progress) => {
          console.log('Loading progress:', progress);
        },
        (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        }
      );
    });
  }

  private mapBones(vrm: VRM) {
    const humanoid = vrm.humanoid;
    if (!humanoid) return;

    this.bones = {
      hips: humanoid.getNormalizedBoneNode('hips'),
      spine: humanoid.getNormalizedBoneNode('spine'),
      chest: humanoid.getNormalizedBoneNode('chest'),
      neck: humanoid.getNormalizedBoneNode('neck'),
      head: humanoid.getNormalizedBoneNode('head'),
      leftShoulder: humanoid.getNormalizedBoneNode('leftShoulder'),
      leftUpperArm: humanoid.getNormalizedBoneNode('leftUpperArm'),
      leftLowerArm: humanoid.getNormalizedBoneNode('leftLowerArm'),
      leftHand: humanoid.getNormalizedBoneNode('leftHand'),
      rightShoulder: humanoid.getNormalizedBoneNode('rightShoulder'),
      rightUpperArm: humanoid.getNormalizedBoneNode('rightUpperArm'),
      rightLowerArm: humanoid.getNormalizedBoneNode('rightLowerArm'),
      rightHand: humanoid.getNormalizedBoneNode('rightHand'),
      leftUpperLeg: humanoid.getNormalizedBoneNode('leftUpperLeg'),
      leftLowerLeg: humanoid.getNormalizedBoneNode('leftLowerLeg'),
      leftFoot: humanoid.getNormalizedBoneNode('leftFoot'),
      rightUpperLeg: humanoid.getNormalizedBoneNode('rightUpperLeg'),
      rightLowerLeg: humanoid.getNormalizedBoneNode('rightLowerLeg'),
      rightFoot: humanoid.getNormalizedBoneNode('rightFoot'),
    };
  }

  private setupModelForTracking(vrm: VRM) {
    // Reset pose to T-pose for better tracking
    if (vrm.humanoid) {
      vrm.humanoid.resetNormalizedPose();
    }

    // Position model in scene
    vrm.scene.position.set(0, 0, 0);
    vrm.scene.rotation.set(0, 0, 0);
  }

  public applyTrackingData(trackingData: StabilizedTrackingData) {
    if (!this.currentVRM || !trackingData.poseLandmarks) return;

    this.applyPoseTracking(trackingData.poseLandmarks);
    
    if (trackingData.leftHandLandmarks) {
      this.applyHandTracking(trackingData.leftHandLandmarks, 'left');
    }
    
    if (trackingData.rightHandLandmarks) {
      this.applyHandTracking(trackingData.rightHandLandmarks, 'right');
    }
  }

  private applyPoseTracking(poseLandmarks: Array<{ x: number; y: number; z: number }>) {
    if (!this.currentVRM) return;

    // MediaPipe pose landmark indices
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    const leftElbow = poseLandmarks[13];
    const rightElbow = poseLandmarks[14];
    // const leftWrist = poseLandmarks[15];
    // const rightWrist = poseLandmarks[16];
    // const leftHip = poseLandmarks[23];
    // const rightHip = poseLandmarks[24];

    // Apply mirror mode coordinate transformation
    const mirrorX = this.mirrorMode ? -1 : 1;

    // Calculate arm rotations
    if (this.bones.leftUpperArm && leftShoulder && leftElbow) {
      const armDirection = new THREE.Vector3(
        (leftElbow.x - leftShoulder.x) * mirrorX,
        -(leftElbow.y - leftShoulder.y),
        leftElbow.z - leftShoulder.z
      ).normalize();
      
      this.bones.leftUpperArm.lookAt(armDirection);
    }

    if (this.bones.rightUpperArm && rightShoulder && rightElbow) {
      const armDirection = new THREE.Vector3(
        (rightElbow.x - rightShoulder.x) * mirrorX,
        -(rightElbow.y - rightShoulder.y),
        rightElbow.z - rightShoulder.z
      ).normalize();
      
      this.bones.rightUpperArm.lookAt(armDirection);
    }

    // Mirror bone swapping for natural mirror behavior
    if (this.mirrorMode) {
      this.swapBoneRotations('leftUpperArm', 'rightUpperArm');
      this.swapBoneRotations('leftLowerArm', 'rightLowerArm');
      this.swapBoneRotations('leftHand', 'rightHand');
    }
  }

  private applyHandTracking(handLandmarks: Array<{ x: number; y: number; z: number }>, hand: 'left' | 'right') {
    if (!this.currentVRM) return;

    // Apply hand pose based on landmark positions
    // This is a simplified implementation - could be expanded for finger tracking
    const wrist = handLandmarks[0];
    const indexTip = handLandmarks[8];
    // const middleTip = handLandmarks[12];

    // Calculate hand direction
    const handDirection = new THREE.Vector3(
      indexTip.x - wrist.x,
      -(indexTip.y - wrist.y),
      indexTip.z - wrist.z
    ).normalize();

    const mirrorX = this.mirrorMode ? -1 : 1;
    handDirection.x *= mirrorX;

    const targetHand = this.mirrorMode 
      ? (hand === 'left' ? this.bones.rightHand : this.bones.leftHand)
      : (hand === 'left' ? this.bones.leftHand : this.bones.rightHand);

    if (targetHand) {
      targetHand.lookAt(handDirection);
    }
  }

  private swapBoneRotations(boneA: keyof VRMBoneMapping, boneB: keyof VRMBoneMapping) {
    const bone1 = this.bones[boneA];
    const bone2 = this.bones[boneB];
    
    if (bone1 && bone2) {
      const tempRotation = bone1.rotation.clone();
      bone1.rotation.copy(bone2.rotation);
      bone2.rotation.copy(tempRotation);
      
      // Mirror the rotations for natural movement
      bone1.rotation.y *= -1;
      bone1.rotation.z *= -1;
      bone2.rotation.y *= -1;
      bone2.rotation.z *= -1;
    }
  }

  public applyBlendShapes(weights: BlendShapeWeights) {
    if (!this.currentVRM || !this.currentVRM.expressionManager) return;

    const expressions = this.currentVRM.expressionManager;

    // Map MediaPipe blend shapes to VRM expressions
    try {
      expressions.setValue('blink_l', weights.eyeBlinkLeft);
      expressions.setValue('blink_r', weights.eyeBlinkRight);
      expressions.setValue('aa', weights.mouthOpen * 0.8); // Mouth open
      expressions.setValue('ih', weights.mouthSmile * 0.6); // Mouth smile
      expressions.setValue('surprised', weights.browUp);
      expressions.setValue('angry', weights.browDown);
    } catch (error) {
      console.warn('Some blend shapes not available:', error);
    }
  }

  public setMirrorMode(enabled: boolean) {
    this.mirrorMode = enabled;
  }

  public update(deltaTime: number) {
    if (this.currentVRM) {
      this.currentVRM.update(deltaTime);
    }
  }

  public getCurrentVRM(): VRM | null {
    return this.currentVRM;
  }

  public dispose() {
    if (this.currentVRM) {
      if (this.scene) {
        this.scene.remove(this.currentVRM.scene);
      }
      // VRM cleanup handled by Three.js
      this.currentVRM = null;
    }
  }
}