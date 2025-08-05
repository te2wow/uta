// Mock for @mediapipe/holistic
const mockHolistic = {
  Holistic: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue({
      poseLandmarks: Array(33).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        visibility: Math.random()
      })),
      faceLandmarks: Array(468).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      })),
      leftHandLandmarks: Array(21).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      })),
      rightHandLandmarks: Array(21).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
      }))
    }),
    close: jest.fn(),
    onResults: jest.fn()
  })),
  
  POSE_LANDMARKS: {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28
  },
  
  FACE_LANDMARKS: {
    // Face outline
    FACE_OVAL: Array.from({ length: 35 }, (_, i) => i),
    // Eyes
    LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
    // Eyebrows
    LEFT_EYEBROW: [46, 53, 52, 51, 48, 115, 131, 134, 102, 49, 220, 305, 292, 303, 267, 269],
    RIGHT_EYEBROW: [276, 283, 282, 295, 285, 336, 296, 334, 293, 300, 276, 283, 282, 295, 285, 336],
    // Lips
    LIPS: [0, 17, 18, 200, 199, 175, 0, 17, 18, 200, 199, 175]
  },
  
  HAND_LANDMARKS: {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_FINGER_MCP: 5,
    INDEX_FINGER_PIP: 6,
    INDEX_FINGER_DIP: 7,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    MIDDLE_FINGER_DIP: 11,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
    RING_FINGER_DIP: 15,
    RING_FINGER_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20
  }
};

module.exports = mockHolistic;