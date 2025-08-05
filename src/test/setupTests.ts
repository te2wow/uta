import '@testing-library/jest-dom';

// Mock Web APIs that are not available in jsdom
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }))
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }))
});

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream()),
    enumerateDevices: jest.fn().mockResolvedValue([
      {
        deviceId: 'default',
        groupId: 'default',
        kind: 'videoinput',
        label: 'Default Camera'
      },
      {
        deviceId: 'mic-default',
        groupId: 'default',
        kind: 'audioinput',
        label: 'Default Microphone'
      }
    ])
  }
});

// Mock MediaStream API
Object.defineProperty(window, 'MediaStream', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getVideoTracks: jest.fn().mockReturnValue([]),
    getAudioTracks: jest.fn().mockReturnValue([]),
    getTracks: jest.fn().mockReturnValue([]),
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    clone: jest.fn().mockReturnValue(new MediaStream()),
    active: true,
    id: 'mock-stream-id'
  }))
});

// Mock MediaStreamTrack
Object.defineProperty(window, 'MediaStreamTrack', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    kind: 'video',
    id: 'mock-track-id',
    label: 'Mock Track',
    enabled: true,
    muted: false,
    readyState: 'live',
    stop: jest.fn(),
    clone: jest.fn(),
    getConstraints: jest.fn().mockReturnValue({}),
    getSettings: jest.fn().mockReturnValue({})
  }))
});

// Mock MediaRecorder API
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    requestData: jest.fn(),
    state: 'inactive',
    mimeType: 'video/webm',
    videoBitsPerSecond: 0,
    audioBitsPerSecond: 0,
    ondataavailable: null,
    onerror: null,
    onpause: null,
    onresume: null,
    onstart: null,
    onstop: null
  }))
});

Object.defineProperty(MediaRecorder, 'isTypeSupported', {
  writable: true,
  value: jest.fn().mockReturnValue(true)
});

// Mock AudioContext API
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    createAnalyser: jest.fn().mockReturnValue({
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn(),
      getFloatFrequencyData: jest.fn(),
      getFloatTimeDomainData: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createBiquadFilter: jest.fn().mockReturnValue({
      type: 'lowpass',
      frequency: { value: 350 },
      Q: { value: 1 },
      gain: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createBuffer: jest.fn(),
    createBufferSource: jest.fn().mockReturnValue({
      buffer: null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      playbackRate: { value: 1 },
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createChannelMerger: jest.fn().mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createChannelSplitter: jest.fn().mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createConvolver: jest.fn().mockReturnValue({
      buffer: null,
      normalize: true,
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createDelay: jest.fn().mockReturnValue({
      delayTime: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createDynamicsCompressor: jest.fn().mockReturnValue({
      threshold: { value: -24 },
      knee: { value: 30 },
      ratio: { value: 12 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createGain: jest.fn().mockReturnValue({
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createOscillator: jest.fn().mockReturnValue({
      type: 'sine',
      frequency: { value: 440 },
      detune: { value: 0 },
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createPanner: jest.fn().mockReturnValue({
      panningModel: 'equalpower',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
      setPosition: jest.fn(),
      setOrientation: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createWaveShaper: jest.fn().mockReturnValue({
      curve: null,
      oversample: 'none',
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createMediaElementSource: jest.fn().mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createMediaStreamSource: jest.fn().mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    createMediaStreamDestination: jest.fn().mockReturnValue({
      stream: new MediaStream(),
      connect: jest.fn(),
      disconnect: jest.fn()
    }),
    decodeAudioData: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    suspend: jest.fn().mockResolvedValue(undefined),
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    destination: {
      maxChannelCount: 2,
      connect: jest.fn(),
      disconnect: jest.fn()
    },
    listener: {
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      forwardX: { value: 0 },
      forwardY: { value: 0 },
      forwardZ: { value: -1 },
      upX: { value: 0 },
      upY: { value: 1 },
      upZ: { value: 0 },
      setPosition: jest.fn(),
      setOrientation: jest.fn()
    }
  }))
});

// Mock WebGL Context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: jest.fn().mockImplementation((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        createTexture: jest.fn(),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texParameteri: jest.fn(),
        generateMipmap: jest.fn(),
        createFramebuffer: jest.fn(),
        bindFramebuffer: jest.fn(),
        framebufferTexture2D: jest.fn(),
        viewport: jest.fn(),
        clear: jest.fn(),
        clearColor: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        drawArrays: jest.fn(),
        drawElements: jest.fn(),
        getAttribLocation: jest.fn(),
        getUniformLocation: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        uniform1i: jest.fn(),
        uniform1f: jest.fn(),
        uniform2f: jest.fn(),
        uniform3f: jest.fn(),
        uniform4f: jest.fn(),
        uniformMatrix4fv: jest.fn(),
        getError: jest.fn().mockReturnValue(0),
        getParameter: jest.fn(),
        getExtension: jest.fn(),
        canvas: null
      };
    }
    return null;
  })
});

// Mock Canvas.captureStream
Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
  writable: true,
  value: jest.fn().mockReturnValue(new MediaStream())
});

// Mock URL API
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn().mockReturnValue('mock-object-url')
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

// Mock File Reader API
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    result: null,
    error: null,
    readyState: 0,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null
  }))
});

// Mock Blob API
Object.defineProperty(window, 'Blob', {
  writable: true,
  value: jest.fn().mockImplementation((parts, properties) => ({
    size: parts ? parts.reduce((acc, part) => acc + (part.length || part.size || 0), 0) : 0,
    type: properties?.type || '',
    parts,
    properties,
    slice: jest.fn(),
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue(''),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0))
  }))
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([]),
    getEntriesByType: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  }
});

// Mock requestAnimationFrame and cancelAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn().mockImplementation((callback) => {
    return setTimeout(callback, 16);
  })
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn().mockImplementation((id) => {
    clearTimeout(id);
  })
});

// Mock WebSocket
Object.defineProperty(window, 'WebSocket', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    readyState: WebSocket.CONNECTING,
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null,
    protocol: '',
    url: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob'
  }))
});

// Define WebSocket constants
Object.defineProperty(WebSocket, 'CONNECTING', { value: 0 });
Object.defineProperty(WebSocket, 'OPEN', { value: 1 });
Object.defineProperty(WebSocket, 'CLOSING', { value: 2 });
Object.defineProperty(WebSocket, 'CLOSED', { value: 3 });

// Mock console methods to avoid noise in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeEach(() => {
  // Mock console methods to suppress expected warnings/errors in tests
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection', reason, promise);
});

// Suppress specific warnings that are expected in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  
  // Suppress Three.js WebGL warnings in tests
  if (typeof message === 'string' && (
    message.includes('WebGL') ||
    message.includes('THREE.') ||
    message.includes('WebGLRenderer') ||
    message.includes('WebGLProgram')
  )) {
    return;
  }
  
  // Suppress MediaPipe warnings
  if (typeof message === 'string' && message.includes('MediaPipe')) {
    return;
  }
  
  // Call original console.error for other messages
  originalConsoleError(...args);
};