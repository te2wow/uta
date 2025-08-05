// Mock for @pixiv/three-vrm library
const mockVRM = {
  VRM: jest.fn().mockImplementation(() => ({
    scene: {
      add: jest.fn(),
      remove: jest.fn(),
      traverse: jest.fn(),
      rotation: { y: 0 },
      position: { set: jest.fn() },
      scale: { set: jest.fn() }
    },
    humanoid: {
      getNormalizedBoneNode: jest.fn().mockReturnValue({
        position: { set: jest.fn() },
        rotation: { set: jest.fn() },
        quaternion: {
          slerp: jest.fn().mockReturnThis(),
          setFromEuler: jest.fn().mockReturnThis(),
          x: 0,
          y: 0,
          z: 0,
          w: 1
        }
      }),
      getBoneNode: jest.fn(),
      getBones: jest.fn().mockReturnValue([]),
      resetPose: jest.fn()
    },
    expressionManager: {
      setValue: jest.fn(),
      getValue: jest.fn().mockReturnValue(0),
      getExpressionTrackName: jest.fn(),
      expressions: new Map(),
      update: jest.fn()
    },
    lookAt: null,
    firstPerson: null,
    springBoneManager: null,
    update: jest.fn(),
    dispose: jest.fn()
  })),
  
  VRMLoaderPlugin: jest.fn().mockImplementation(() => ({
    name: 'VRMLoaderPlugin',
    register: jest.fn(),
    unregister: jest.fn()
  })),
  
  VRMUtils: {
    deepDispose: jest.fn(),
    removeUnnecessaryVertices: jest.fn(),
    removeUnnecessaryJoints: jest.fn()
  },
  
  VRMHumanBoneName: {
    Hips: 'hips',
    Spine: 'spine',
    Chest: 'chest',
    UpperChest: 'upperChest',
    Neck: 'neck',
    Head: 'head',
    LeftEye: 'leftEye',
    RightEye: 'rightEye',
    Jaw: 'jaw',
    LeftShoulder: 'leftShoulder',
    LeftUpperArm: 'leftUpperArm',
    LeftLowerArm: 'leftLowerArm',
    LeftHand: 'leftHand',
    RightShoulder: 'rightShoulder',
    RightUpperArm: 'rightUpperArm',
    RightLowerArm: 'rightLowerArm',
    RightHand: 'rightHand',
    LeftUpperLeg: 'leftUpperLeg',
    LeftLowerLeg: 'leftLowerLeg',
    LeftFoot: 'leftFoot',
    LeftToes: 'leftToes',
    RightUpperLeg: 'rightUpperLeg',
    RightLowerLeg: 'rightLowerLeg',
    RightFoot: 'rightFoot',
    RightToes: 'rightToes',
    LeftThumbProximal: 'leftThumbProximal',
    LeftThumbIntermediate: 'leftThumbIntermediate',
    LeftThumbDistal: 'leftThumbDistal',
    LeftIndexProximal: 'leftIndexProximal',
    LeftIndexIntermediate: 'leftIndexIntermediate',
    LeftIndexDistal: 'leftIndexDistal',
    LeftMiddleProximal: 'leftMiddleProximal',
    LeftMiddleIntermediate: 'leftMiddleIntermediate',
    LeftMiddleDistal: 'leftMiddleDistal',
    LeftRingProximal: 'leftRingProximal',
    LeftRingIntermediate: 'leftRingIntermediate',
    LeftRingDistal: 'leftRingDistal',
    LeftLittleProximal: 'leftLittleProximal',
    LeftLittleIntermediate: 'leftLittleIntermediate',
    LeftLittleDistal: 'leftLittleDistal',
    RightThumbProximal: 'rightThumbProximal',
    RightThumbIntermediate: 'rightThumbIntermediate',
    RightThumbDistal: 'rightThumbDistal',
    RightIndexProximal: 'rightIndexProximal',
    RightIndexIntermediate: 'rightIndexIntermediate',
    RightIndexDistal: 'rightIndexDistal',
    RightMiddleProximal: 'rightMiddleProximal',
    RightMiddleIntermediate: 'rightMiddleIntermediate',
    RightMiddleDistal: 'rightMiddleDistal',
    RightRingProximal: 'rightRingProximal',
    RightRingIntermediate: 'rightRingIntermediate',
    RightRingDistal: 'rightRingDistal',
    RightLittleProximal: 'rightLittleProximal',
    RightLittleIntermediate: 'rightLittleIntermediate',
    RightLittleDistal: 'rightLittleDistal'
  },
  
  VRMExpressionPresetName: {
    Aa: 'aa',
    Ih: 'ih',
    Ou: 'ou',
    Ee: 'ee',
    Oh: 'oh',
    Blink: 'blink',
    BlinkLeft: 'blinkLeft',
    BlinkRight: 'blinkRight',
    LookUp: 'lookUp',
    LookDown: 'lookDown',
    LookLeft: 'lookLeft',
    LookRight: 'lookRight',
    Happy: 'happy',
    Angry: 'angry',
    Sad: 'sad',
    Relaxed: 'relaxed',
    Surprised: 'surprised'
  }
};

module.exports = mockVRM;