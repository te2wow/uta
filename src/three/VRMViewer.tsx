import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface VRMViewerProps {
  vrmFile: File | null;
  trackingData: any;
  onVRMLoaded?: (vrm: VRM) => void;
  className?: string;
}

export const VRMViewer: React.FC<VRMViewerProps> = ({ 
  vrmFile, 
  trackingData, 
  onVRMLoaded,
  className 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const previewCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const frameId = useRef<number>();
  const clockRef = useRef(new THREE.Clock());

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mountRef.current || !canvasRef.current || !previewCanvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Main camera (front view for recording)
    const camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.4, 3);
    camera.lookAt(new THREE.Vector3(0, 1, 0));
    cameraRef.current = camera;

    // Preview camera (back view)
    const previewCamera = new THREE.PerspectiveCamera(
      30,
      1, // 1:1 aspect ratio for preview
      0.1,
      1000
    );
    previewCamera.position.set(0, 1.4, -3);
    previewCamera.lookAt(new THREE.Vector3(0, 1, 0));
    previewCameraRef.current = previewCamera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // OrbitControls for main camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.update();

    // Animation loop
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      // Update controls
      controls.update();

      // Update VRM if loaded
      if (vrmRef.current) {
        vrmRef.current.update(delta);
        
        // Apply tracking data if available
        if (trackingData) {
          applyTrackingData(vrmRef.current, trackingData);
        }
      }

      // Render main view
      renderer.render(scene, camera);

      // Render preview to separate canvas
      if (previewCanvasRef.current) {
        const previewRenderer = new THREE.WebGLRenderer({ 
          canvas: previewCanvasRef.current,
          antialias: true,
          alpha: false
        });
        previewRenderer.setSize(256, 256);
        previewRenderer.render(scene, previewCamera);
        previewRenderer.dispose();
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer || !mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Load VRM file
  useEffect(() => {
    if (!vrmFile || !sceneRef.current) return;

    setIsLoading(true);
    const url = URL.createObjectURL(vrmFile);
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      async (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        
        // Remove old VRM if exists
        if (vrmRef.current) {
          sceneRef.current!.remove(vrmRef.current.scene);
          VRMUtils.deepDispose(vrmRef.current.scene);
        }

        // Rotate VRM 180 degrees for mirror effect
        vrm.scene.rotation.y = Math.PI;
        
        sceneRef.current!.add(vrm.scene);
        vrmRef.current = vrm;
        
        // Setup VRM
        vrm.humanoid?.getNormalizedBoneNode('hips')?.position.set(0, 0, 0);
        
        setIsLoading(false);
        onVRMLoaded?.(vrm);
        
        URL.revokeObjectURL(url);
      },
      (progress) => {
        console.log('Loading VRM...', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading VRM:', error);
        setIsLoading(false);
        URL.revokeObjectURL(url);
      }
    );
  }, [vrmFile, onVRMLoaded]);

  // Apply MediaPipe tracking data to VRM
  const applyTrackingData = (vrm: VRM, data: any) => {
    if (!vrm.humanoid) return;

    // Apply pose tracking with mirror effect
    if (data.pose) {
      applyPoseTracking(vrm, data.pose);
    }

    // Apply face tracking
    if (data.face) {
      applyFaceTracking(vrm, data.face);
    }

    // Apply hand tracking
    if (data.leftHand) {
      applyHandTracking(vrm, data.leftHand, 'left');
    }
    if (data.rightHand) {
      applyHandTracking(vrm, data.rightHand, 'right');
    }
  };

  const applyPoseTracking = (vrm: VRM, poseData: any) => {
    // Implementation for pose tracking
    // This will be expanded with actual bone mapping
  };

  const applyFaceTracking = (vrm: VRM, faceData: any) => {
    // Implementation for face tracking and blend shapes
    // This will be expanded with actual blend shape mapping
  };

  const applyHandTracking = (vrm: VRM, handData: any, side: 'left' | 'right') => {
    // Implementation for hand tracking
    // This will be expanded with actual finger bone mapping
  };

  return (
    <div ref={mountRef} className={`relative w-full h-full ${className || ''}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        id="main-canvas"
      />
      
      {/* Preview canvas (back view) */}
      <canvas 
        ref={previewCanvasRef}
        className="absolute bottom-4 right-4 w-64 h-64 border-2 border-gray-300 rounded-lg shadow-lg"
        width={256}
        height={256}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-xl">Loading VRM...</div>
        </div>
      )}
    </div>
  );
};