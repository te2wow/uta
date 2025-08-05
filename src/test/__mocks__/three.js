// Mock for Three.js library
const mockThree = {
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    traverse: jest.fn(),
    background: null,
    fog: null,
    overrideMaterial: null,
    autoUpdate: true,
    children: []
  })),
  
  PerspectiveCamera: jest.fn().mockImplementation(() => ({
    position: {
      set: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      x: 0,
      y: 0,
      z: 0
    },
    rotation: {
      set: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      x: 0,
      y: 0,
      z: 0
    },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn(),
    aspect: 1,
    fov: 75,
    near: 0.1,
    far: 1000
  })),
  
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    setClearColor: jest.fn(),
    clear: jest.fn(),
    domElement: document.createElement('canvas'),
    outputColorSpace: 'srgb',
    toneMapping: 0,
    toneMappingExposure: 1,
    shadowMap: {
      enabled: false,
      type: 0
    }
  })),
  
  DirectionalLight: jest.fn().mockImplementation(() => ({
    position: {
      set: jest.fn().mockReturnThis(),
      normalize: jest.fn().mockReturnThis(),
      x: 0,
      y: 0,
      z: 0
    },
    intensity: 1,
    color: { r: 1, g: 1, b: 1 },
    castShadow: false,
    shadow: {
      mapSize: { width: 1024, height: 1024 },
      camera: {
        left: -5,
        right: 5,
        top: 5,
        bottom: -5,
        near: 0.1,
        far: 50
      }
    }
  })),
  
  AmbientLight: jest.fn().mockImplementation(() => ({
    intensity: 1,
    color: { r: 1, g: 1, b: 1 }
  })),
  
  Color: jest.fn().mockImplementation((color) => ({
    r: 1,
    g: 1,
    b: 1,
    set: jest.fn().mockReturnThis(),
    setHex: jest.fn().mockReturnThis(),
    setRGB: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis()
  })),
  
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x,
    y,
    z,
    set: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    add: jest.fn().mockReturnThis(),
    sub: jest.fn().mockReturnThis(),
    multiply: jest.fn().mockReturnThis(),
    normalize: jest.fn().mockReturnThis(),
    length: jest.fn().mockReturnValue(1),
    distanceTo: jest.fn().mockReturnValue(1),
    dot: jest.fn().mockReturnValue(1),
    cross: jest.fn().mockReturnThis()
  })),
  
  Quaternion: jest.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    z: 0,
    w: 1,
    set: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    setFromEuler: jest.fn().mockReturnThis(),
    setFromAxisAngle: jest.fn().mockReturnThis(),
    slerp: jest.fn().mockReturnThis(),
    multiply: jest.fn().mockReturnThis(),
    normalize: jest.fn().mockReturnThis()
  })),
  
  Euler: jest.fn().mockImplementation((x = 0, y = 0, z = 0, order = 'XYZ') => ({
    x,
    y,
    z,
    order,
    set: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    setFromQuaternion: jest.fn().mockReturnThis()
  })),
  
  Object3D: jest.fn().mockImplementation(() => ({
    position: {
      set: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      x: 0,
      y: 0,
      z: 0
    },
    rotation: {
      set: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      x: 0,
      y: 0,
      z: 0
    },
    scale: {
      set: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      x: 1,
      y: 1,
      z: 1
    },
    quaternion: {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
      slerp: jest.fn().mockReturnThis(),
      setFromEuler: jest.fn().mockReturnThis()
    },
    add: jest.fn(),
    remove: jest.fn(),
    traverse: jest.fn(),
    clone: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    lookAt: jest.fn(),
    updateMatrix: jest.fn(),
    updateMatrixWorld: jest.fn(),
    children: []
  })),
  
  Clock: jest.fn().mockImplementation(() => ({
    getDelta: jest.fn().mockReturnValue(0.016),
    getElapsedTime: jest.fn().mockReturnValue(1.0),
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    running: false,
    autoStart: true
  })),
  
  // Constants
  SRGBColorSpace: 'srgb',
  LinearSRGBColorSpace: 'srgb-linear',
  
  // Math utilities
  MathUtils: {
    degToRad: jest.fn((degrees) => degrees * (Math.PI / 180)),
    radToDeg: jest.fn((radians) => radians * (180 / Math.PI)),
    clamp: jest.fn((value, min, max) => Math.min(Math.max(value, min), max)),
    lerp: jest.fn((x, y, t) => x * (1 - t) + y * t)
  }
};

module.exports = mockThree;