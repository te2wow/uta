// Mock for @ffmpeg/ffmpeg
const mockFFmpeg = {
  FFmpeg: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5])),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    terminate: jest.fn().mockResolvedValue(undefined),
    
    // Mock properties
    loaded: true,
    running: false,
    
    // Mock events
    onLog: jest.fn(),
    onProgress: jest.fn(),
    onComplete: jest.fn()
  }))
};

module.exports = mockFFmpeg;