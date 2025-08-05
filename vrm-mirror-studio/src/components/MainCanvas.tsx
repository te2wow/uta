import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { VRMService } from '../services/VRMService';
import { MediaPipeService } from '../services/MediaPipeService';
import { RecordingService } from '../services/RecordingService';
import { TrackingStabilizer } from '../utils/TrackingStabilizer';

interface MainCanvasProps {
  vrmFile: File | null;
  selectedCamera: string;
  isRecording: boolean;
  onFPSUpdate: (fps: number) => void;
  onTrackingUpdate: (status: Partial<{
    face: boolean;
    pose: boolean;
    hands: boolean;
  }>) => void;
  recordedChunks: React.MutableRefObject<Blob[]>;
}

const MainCanvas: React.FC<MainCanvasProps> = ({
  vrmFile,
  selectedCamera,
  isRecording,
  onFPSUpdate,
  onTrackingUpdate,
  recordedChunks,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Three.js setup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const previewRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const previewCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Services
  const vrmServiceRef = useRef<VRMService | null>(null);
  const mediaPipeServiceRef = useRef<MediaPipeService | null>(null);
  const recordingServiceRef = useRef<RecordingService | null>(null);
  const stabilizerRef = useRef<TrackingStabilizer | null>(null);
  
  // Animation state
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!mainCanvasRef.current || !previewCanvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x212121);
    sceneRef.current = scene;

    // Create main camera (front view)
    const camera = new THREE.PerspectiveCamera(
      30,
      mainCanvasRef.current.clientWidth / mainCanvasRef.current.clientHeight,
      0.1,
      20
    );
    camera.position.set(0, 1.4, 3);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Create preview camera (back view)
    const previewCamera = new THREE.PerspectiveCamera(
      30,
      previewCanvasRef.current.clientWidth / previewCanvasRef.current.clientHeight,
      0.1,
      20
    );
    previewCamera.position.set(0, 1.4, -3);
    previewCamera.lookAt(0, 1, 0);
    previewCameraRef.current = previewCamera;

    // Create main renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: mainCanvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Create preview renderer
    const previewRenderer = new THREE.WebGLRenderer({
      canvas: previewCanvasRef.current,
      alpha: true,
      antialias: true
    });
    previewRenderer.setSize(previewCanvasRef.current.clientWidth, previewCanvasRef.current.clientHeight);
    previewRenderer.setPixelRatio(window.devicePixelRatio);
    previewRendererRef.current = previewRenderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Initialize services
    vrmServiceRef.current = new VRMService();
    mediaPipeServiceRef.current = new MediaPipeService();
    recordingServiceRef.current = new RecordingService();
    stabilizerRef.current = new TrackingStabilizer();

    // Setup MediaPipe callbacks
    mediaPipeServiceRef.current.setOnResults((results) => {
      if (stabilizerRef.current && vrmServiceRef.current) {
        const stabilizedData = stabilizerRef.current.stabilize(results, performance.now());
        vrmServiceRef.current.applyTrackingData(stabilizedData);
        
        // Update tracking status
        onTrackingUpdate({
          face: !!results.faceLandmarks,
          pose: !!results.poseLandmarks,
          hands: !!(results.leftHandLandmarks || results.rightHandLandmarks)
        });
      }
    });

    mediaPipeServiceRef.current.setOnBlendShapes((weights) => {
      if (vrmServiceRef.current) {
        vrmServiceRef.current.applyBlendShapes(weights);
      }
    });

    mediaPipeServiceRef.current.setOnFPSUpdate(onFPSUpdate);

    // Setup recording service
    recordingServiceRef.current.setOnDataAvailable((chunks) => {
      recordedChunks.current = chunks;
    });

    console.log('Scene initialized');
  }, [onFPSUpdate, onTrackingUpdate, recordedChunks]);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !previewRendererRef.current || 
        !cameraRef.current || !previewCameraRef.current) return;

    const deltaTime = clockRef.current.getDelta();

    // Update VRM
    if (vrmServiceRef.current) {
      vrmServiceRef.current.update(deltaTime);
    }

    // Render main view
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    // Render preview view
    previewRendererRef.current.render(sceneRef.current, previewCameraRef.current);

    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mainCanvasRef.current || !previewCanvasRef.current || 
        !rendererRef.current || !previewRendererRef.current ||
        !cameraRef.current || !previewCameraRef.current) return;

    // Update main canvas
    const mainWidth = mainCanvasRef.current.clientWidth;
    const mainHeight = mainCanvasRef.current.clientHeight;
    cameraRef.current.aspect = mainWidth / mainHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(mainWidth, mainHeight);

    // Update preview canvas
    const previewWidth = previewCanvasRef.current.clientWidth;
    const previewHeight = previewCanvasRef.current.clientHeight;
    previewCameraRef.current.aspect = previewWidth / previewHeight;
    previewCameraRef.current.updateProjectionMatrix();
    previewRendererRef.current.setSize(previewWidth, previewHeight);
  }, []);

  // Initialize scene on mount
  useEffect(() => {
    initializeScene();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      // Cleanup services
      vrmServiceRef.current?.dispose();
      mediaPipeServiceRef.current?.destroy();
      recordingServiceRef.current?.dispose();
      
      // Cleanup Three.js
      rendererRef.current?.dispose();
      previewRendererRef.current?.dispose();
    };
  }, [initializeScene, animate, handleResize]);

  // Handle VRM file loading
  useEffect(() => {
    if (vrmFile && vrmServiceRef.current && sceneRef.current) {
      vrmServiceRef.current.loadVRM(vrmFile, sceneRef.current)
        .then(() => {
          console.log('VRM loaded successfully');
        })
        .catch((error) => {
          console.error('Failed to load VRM:', error);
        });
    }
  }, [vrmFile]);

  // Handle camera selection
  useEffect(() => {
    if (selectedCamera && mediaPipeServiceRef.current && videoRef.current) {
      mediaPipeServiceRef.current.switchCamera(selectedCamera, videoRef.current)
        .then((success) => {
          if (success) {
            console.log('Camera switched successfully');
          }
        })
        .catch((error) => {
          console.error('Failed to switch camera:', error);
        });
    } else if (!selectedCamera && mediaPipeServiceRef.current && videoRef.current) {
      // Auto-initialize with default camera
      mediaPipeServiceRef.current.initialize(videoRef.current)
        .then((success) => {
          if (success) {
            console.log('Default camera initialized');
          }
        })
        .catch((error) => {
          console.error('Failed to initialize default camera:', error);
        });
    }
  }, [selectedCamera]);

  // Handle recording
  useEffect(() => {
    if (!recordingServiceRef.current || !mainCanvasRef.current) return;

    if (isRecording) {
      recordingServiceRef.current.startRecording(mainCanvasRef.current)
        .then((success) => {
          if (success) {
            console.log('Recording started');
          } else {
            console.error('Failed to start recording');
          }
        });
    } else {
      if (recordingServiceRef.current.isCurrentlyRecording()) {
        recordingServiceRef.current.stopRecording()
          .then(() => {
            console.log('Recording stopped');
          })
          .catch((error) => {
            console.error('Failed to stop recording:', error);
          });
      }
    }
  }, [isRecording]);

  return (
    <main className="flex-1 relative bg-gray-900 p-4">
      {/* Hidden video element for camera feed */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
      />

      {/* Main Canvas - Front View */}
      <div className="w-full h-full relative rounded-lg overflow-hidden bg-black">
        <canvas
          ref={mainCanvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
        
        {/* Preview Canvas - Back View */}
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden bg-black border-2 border-gray-700">
          <canvas
            ref={previewCanvasRef}
            className="w-full h-full"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
            Back View
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 text-sm font-medium">REC</span>
          </div>
        )}

        {/* No Model Loaded Overlay */}
        {!vrmFile && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-400">No VRM model loaded</p>
              <p className="text-gray-500 text-sm mt-1">Select a VRM file to begin</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MainCanvas;