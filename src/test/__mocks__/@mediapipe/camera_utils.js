// Mock for @mediapipe/camera_utils
const mockCameraUtils = {
  Camera: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    h: { video: null }, // Mock video element
    g: jest.fn() // Mock function
  }))
};

module.exports = mockCameraUtils;