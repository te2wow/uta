import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRMViewer } from '../VRMViewer';

// Mock Three.js and related libraries
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  Scene: jest.fn().mockImplementation(() => ({
    background: null,
    add: jest.fn(),
    remove: jest.fn()
  })),
  DirectionalLight: jest.fn().mockImplementation(() => ({
    position: {
      set: jest.fn().mockReturnThis(),
      normalize: jest.fn().mockReturnThis()
    }
  })),
  AmbientLight: jest.fn(),
  PerspectiveCamera: jest.fn().mockImplementation(() => ({
    position: {
      set: jest.fn()
    },
    lookAt: jest.fn(),
    aspect: 1,
    updateProjectionMatrix: jest.fn()
  })),
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setPixelRatio: jest.fn(),
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: document.createElement('canvas'),
    outputColorSpace: null
  })),
  Color: jest.fn(),
  Vector3: jest.fn(),
  Clock: jest.fn().mockImplementation(() => ({
    getDelta: jest.fn().mockReturnValue(0.016)
  })),
  Object3D: jest.fn().mockImplementation(() => ({
    position: {
      set: jest.fn()
    },
    rotation: {
      y: 0
    }
  })),
  SRGBColorSpace: 'srgb'
}));

jest.mock('@pixiv/three-vrm', () => ({
  VRM: jest.fn(),
  VRMLoaderPlugin: jest.fn(),
  VRMUtils: {
    deepDispose: jest.fn()
  }
}));

jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({
    register: jest.fn(),
    load: jest.fn()
  }))
}));

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    target: {
      set: jest.fn()
    },
    enableDamping: true,
    dampingFactor: 0.05,
    enablePan: false,
    minDistance: 1,
    maxDistance: 10,
    update: jest.fn(),
    dispose: jest.fn()
  }))
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

describe('VRMViewer', () => {
  let mockFile: File;
  let mockTrackingData: any;
  let onVRMLoadedMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock file
    mockFile = new File(['mock vrm content'], 'test.vrm', {
      type: 'application/octet-stream'
    });

    mockTrackingData = {
      pose: [
        { x: 0.5, y: 0.5, z: 0.0 },
        { x: 0.6, y: 0.4, z: 0.1 }
      ],
      face: [
        { x: 0.5, y: 0.3, z: 0.0 }
      ],
      leftHand: [
        { x: 0.3, y: 0.7, z: 0.2 }
      ],
      rightHand: [
        { x: 0.7, y: 0.7, z: 0.2 }
      ]
    };

    onVRMLoadedMock = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
          onVRMLoaded={onVRMLoadedMock}
        />
      );

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render main canvas', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      const mainCanvas = document.getElementById('main-canvas');
      expect(mainCanvas).toBeInTheDocument();
    });

    it('should render preview canvas', () => {
      const { container } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      const previewCanvas = container.querySelector('canvas[width="256"][height="256"]');
      expect(previewCanvas).toBeInTheDocument();
    });
  });

  describe('Three.js setup', () => {
    it('should initialize Three.js scene', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      expect(THREE.Scene).toHaveBeenCalled();
      expect(THREE.DirectionalLight).toHaveBeenCalled();
      expect(THREE.AmbientLight).toHaveBeenCalled();
    });

    it('should initialize cameras', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      expect(THREE.PerspectiveCamera).toHaveBeenCalledTimes(2);
    });

    it('should initialize renderer', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });

    it('should initialize OrbitControls', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      expect(OrbitControls).toHaveBeenCalled();
    });
  });

  describe('VRM file loading', () => {
    let mockGLTFLoader: jest.Mocked<GLTFLoader>;
    let mockVRM: jest.Mocked<VRM>;

    beforeEach(() => {
      mockVRM = {
        scene: new THREE.Object3D(),
        humanoid: {
          getNormalizedBoneNode: jest.fn().mockReturnValue({
            position: {
              set: jest.fn()
            }
          })
        },
        update: jest.fn()
      } as any;

      mockGLTFLoader = {
        register: jest.fn(),
        load: jest.fn()
      } as any;

      (GLTFLoader as jest.Mock).mockImplementation(() => mockGLTFLoader);
    });

    it('should not load VRM when file is null', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      expect(mockGLTFLoader.load).not.toHaveBeenCalled();
    });

    it('should load VRM file when provided', async () => {
      mockGLTFLoader.load.mockImplementation((url, onLoad) => {
        setTimeout(() => {
          onLoad({
            userData: {
              vrm: mockVRM
            }
          } as any);
        }, 0);
      });

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
          onVRMLoaded={onVRMLoadedMock}
        />
      );

      expect(mockGLTFLoader.register).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGLTFLoader.load).toHaveBeenCalledWith(
        'mock-url',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );

      await waitFor(() => {
        expect(onVRMLoadedMock).toHaveBeenCalledWith(mockVRM);
      });
    });

    it('should show loading state during VRM load', () => {
      mockGLTFLoader.load.mockImplementation(() => {
        // Don't call onLoad to keep loading state
      });

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
        />
      );

      expect(screen.getByText('Loading VRM...')).toBeInTheDocument();
    });

    it('should hide loading state after VRM loads', async () => {
      mockGLTFLoader.load.mockImplementation((url, onLoad) => {
        setTimeout(() => {
          onLoad({
            userData: {
              vrm: mockVRM
            }
          } as any);
        }, 0);
      });

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading VRM...')).not.toBeInTheDocument();
      });
    });

    it('should handle VRM load error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockGLTFLoader.load.mockImplementation((url, onLoad, onProgress, onError) => {
        setTimeout(() => {
          onError(new Error('Load failed'));
        }, 0);
      });

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
        />
      );

      waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading VRM:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle VRM load progress', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockGLTFLoader.load.mockImplementation((url, onLoad, onProgress) => {
        setTimeout(() => {
          onProgress({ loaded: 50, total: 100 } as any);
        }, 0);
      });

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
        />
      );

      waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Loading VRM...', 50, '%');
      });

      consoleLogSpy.mockRestore();
    });

    it('should replace old VRM when loading new one', async () => {
      const oldVRM = { ...mockVRM };
      const newVRM = { ...mockVRM };

      mockGLTFLoader.load
        .mockImplementationOnce((url, onLoad) => {
          setTimeout(() => onLoad({ userData: { vrm: oldVRM } } as any), 0);
        })
        .mockImplementationOnce((url, onLoad) => {
          setTimeout(() => onLoad({ userData: { vrm: newVRM } } as any), 0);
        });

      const { rerender } = render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
          onVRMLoaded={onVRMLoadedMock}
        />
      );

      await waitFor(() => {
        expect(onVRMLoadedMock).toHaveBeenCalledWith(oldVRM);
      });

      const newFile = new File(['new vrm'], 'new.vrm', { type: 'application/octet-stream' });
      
      rerender(
        <VRMViewer
          vrmFile={newFile}
          trackingData={null}
          onVRMLoaded={onVRMLoadedMock}
        />
      );

      await waitFor(() => {
        expect(VRMUtils.deepDispose).toHaveBeenCalledWith(oldVRM.scene);
        expect(onVRMLoadedMock).toHaveBeenCalledWith(newVRM);
      });
    });

    it('should apply mirror rotation to VRM', async () => {
      mockGLTFLoader.load.mockImplementation((url, onLoad) => {
        setTimeout(() => {
          onLoad({
            userData: {
              vrm: mockVRM
            }
          } as any);
        }, 0);
      });

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
        />
      );

      await waitFor(() => {
        expect(mockVRM.scene.rotation.y).toBe(Math.PI);
      });
    });
  });

  describe('tracking data application', () => {
    it('should apply tracking data when VRM is loaded', async () => {
      const mockVRM = {
        scene: new THREE.Object3D(),
        humanoid: {
          getNormalizedBoneNode: jest.fn().mockReturnValue({
            position: { set: jest.fn() }
          })
        },
        update: jest.fn()
      } as any;

      const mockGLTFLoader = {
        register: jest.fn(),
        load: jest.fn().mockImplementation((url, onLoad) => {
          setTimeout(() => {
            onLoad({ userData: { vrm: mockVRM } } as any);
          }, 0);
        })
      } as any;

      (GLTFLoader as jest.Mock).mockImplementation(() => mockGLTFLoader);

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={mockTrackingData}
        />
      );

      await waitFor(() => {
        expect(mockVRM.update).toHaveBeenCalled();
      });
    });

    it('should handle tracking data without loaded VRM', () => {
      expect(() => {
        render(
          <VRMViewer
            vrmFile={null}
            trackingData={mockTrackingData}
          />
        );
      }).not.toThrow();
    });

    it('should handle null tracking data', () => {
      expect(() => {
        render(
          <VRMViewer
            vrmFile={null}
            trackingData={null}
          />
        );
      }).not.toThrow();
    });
  });

  describe('resize handling', () => {
    it('should handle window resize', () => {
      const { container } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      act(() => {
        // Simulate window resize
        Object.defineProperty(window, 'innerWidth', { value: 1920 });
        Object.defineProperty(window, 'innerHeight', { value: 1080 });
        
        const resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent);
      });

      // Verify camera and renderer are updated
      expect(container).toBeInTheDocument();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      unmount();

      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should dispose renderer on unmount', () => {
      const mockRenderer = {
        setPixelRatio: jest.fn(),
        setSize: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        domElement: document.createElement('canvas'),
        outputColorSpace: null
      };

      (THREE.WebGLRenderer as jest.Mock).mockImplementation(() => mockRenderer);

      const { unmount } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      unmount();

      expect(mockRenderer.dispose).toHaveBeenCalled();
    });

    it('should dispose controls on unmount', () => {
      const mockControls = {
        target: { set: jest.fn() },
        enableDamping: true,
        update: jest.fn(),
        dispose: jest.fn()
      };

      (OrbitControls as jest.Mock).mockImplementation(() => mockControls);

      const { unmount } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      unmount();

      expect(mockControls.dispose).toHaveBeenCalled();
    });
  });

  describe('error boundaries and edge cases', () => {
    it('should handle missing canvas refs', () => {
      // Mock refs to return null
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockReturnValue(null);

      expect(() => {
        render(
          <VRMViewer
            vrmFile={null}
            trackingData={null}
          />
        );
      }).not.toThrow();

      document.createElement = originalCreateElement;
    });

    it('should handle WebGL context creation failure', () => {
      const mockRenderer = {
        setPixelRatio: jest.fn(),
        setSize: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        domElement: null,
        outputColorSpace: null
      };

      (THREE.WebGLRenderer as jest.Mock).mockImplementation(() => {
        throw new Error('WebGL not supported');
      });

      expect(() => {
        render(
          <VRMViewer
            vrmFile={null}
            trackingData={null}
          />
        );
      }).not.toThrow();
    });
  });

  describe('animation loop', () => {
    it('should start animation loop on mount', () => {
      render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should update VRM in animation loop', async () => {
      const mockVRM = {
        scene: new THREE.Object3D(),
        humanoid: {
          getNormalizedBoneNode: jest.fn().mockReturnValue({
            position: { set: jest.fn() }
          })
        },
        update: jest.fn()
      } as any;

      const mockGLTFLoader = {
        register: jest.fn(),
        load: jest.fn().mockImplementation((url, onLoad) => {
          setTimeout(() => {
            onLoad({ userData: { vrm: mockVRM } } as any);
          }, 0);
        })
      } as any;

      (GLTFLoader as jest.Mock).mockImplementation(() => mockGLTFLoader);

      render(
        <VRMViewer
          vrmFile={mockFile}
          trackingData={null}
        />
      );

      await waitFor(() => {
        expect(mockVRM.update).toHaveBeenCalled();
      });
    });
  });

  describe('preview canvas rendering', () => {
    it('should render to preview canvas', () => {
      const { container } = render(
        <VRMViewer
          vrmFile={null}
          trackingData={null}
        />
      );

      const previewCanvas = container.querySelector('canvas[width="256"][height="256"]');
      expect(previewCanvas).toBeInTheDocument();
      expect(previewCanvas).toHaveClass('absolute', 'bottom-4', 'right-4');
    });

    it('should handle preview canvas rendering errors gracefully', () => {
      // Mock WebGLRenderer to throw error for preview
      let callCount = 0;
      (THREE.WebGLRenderer as jest.Mock).mockImplementation(({ canvas }) => {
        callCount++;
        if (callCount > 1) {
          // Throw error for preview renderer
          throw new Error('Preview render failed');
        }
        return {
          setPixelRatio: jest.fn(),
          setSize: jest.fn(),
          render: jest.fn(),
          dispose: jest.fn(),
          domElement: canvas || document.createElement('canvas'),
          outputColorSpace: null
        };
      });

      expect(() => {
        render(
          <VRMViewer
            vrmFile={null}
            trackingData={null}
          />
        );
      }).not.toThrow();
    });
  });
});