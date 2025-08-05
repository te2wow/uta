import { Holistic, type Results, type NormalizedLandmarkList } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';

export interface TrackingResult {
  poseLandmarks?: NormalizedLandmarkList;
  faceLandmarks?: NormalizedLandmarkList;
  leftHandLandmarks?: NormalizedLandmarkList;
  rightHandLandmarks?: NormalizedLandmarkList;
}

export interface BlendShapeWeights {
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeLookUp: number;
  eyeLookDown: number;
  eyeLookLeft: number;
  eyeLookRight: number;
  mouthOpen: number;
  mouthSmile: number;
  browUp: number;
  browDown: number;
}

export class MediaPipeService {
  private holistic: Holistic;
  private camera: Camera | null = null;
  private onResults: ((results: TrackingResult) => void) | null = null;
  private onBlendShapes: ((weights: BlendShapeWeights) => void) | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private onFPSUpdate: ((fps: number) => void) | null = null;

  constructor() {
    this.holistic = new Holistic({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }
    });

    this.holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.holistic.onResults(this.handleResults.bind(this));
  }

  private handleResults(results: Results) {
    const now = performance.now();
    this.frameCount++;
    
    if (now - this.lastFrameTime >= 1000) {
      if (this.onFPSUpdate) {
        this.onFPSUpdate(this.frameCount);
      }
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    const trackingResult: TrackingResult = {
      poseLandmarks: results.poseLandmarks,
      faceLandmarks: results.faceLandmarks,
      leftHandLandmarks: results.leftHandLandmarks,
      rightHandLandmarks: results.rightHandLandmarks,
    };

    if (this.onResults) {
      this.onResults(trackingResult);
    }

    // Extract blend shapes from face landmarks
    if (results.faceLandmarks && this.onBlendShapes) {
      const blendShapes = this.extractBlendShapes(results.faceLandmarks);
      this.onBlendShapes(blendShapes);
    }
  }

  private extractBlendShapes(faceLandmarks: NormalizedLandmarkList): BlendShapeWeights {
    // MediaPipe face landmarks indices
    const leftEyeTop = faceLandmarks[159];
    const leftEyeBottom = faceLandmarks[145];
    const rightEyeTop = faceLandmarks[386];
    const rightEyeBottom = faceLandmarks[374];
    
    const mouthTop = faceLandmarks[13];
    const mouthBottom = faceLandmarks[14];
    const mouthLeft = faceLandmarks[61];
    const mouthRight = faceLandmarks[291];
    
    const leftBrow = faceLandmarks[70];
    const rightBrow = faceLandmarks[300];
    const browCenter = faceLandmarks[9];

    // Calculate eye blink (distance between top and bottom eyelid)
    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    
    // Calculate mouth opening
    const mouthHeight = Math.abs(mouthTop.y - mouthBottom.y);
    const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x);
    
    // Calculate brow movement
    const leftBrowHeight = browCenter.y - leftBrow.y;
    const rightBrowHeight = browCenter.y - rightBrow.y;

    return {
      eyeBlinkLeft: Math.max(0, 1 - leftEyeHeight * 50),
      eyeBlinkRight: Math.max(0, 1 - rightEyeHeight * 50),
      eyeLookUp: 0, // Would need more complex calculation
      eyeLookDown: 0,
      eyeLookLeft: 0,
      eyeLookRight: 0,
      mouthOpen: Math.min(1, mouthHeight * 15),
      mouthSmile: Math.min(1, mouthWidth * 2 - 0.5),
      browUp: Math.max(0, leftBrowHeight + rightBrowHeight),
      browDown: Math.max(0, -(leftBrowHeight + rightBrowHeight)),
    };
  }

  public async initialize(videoElement: HTMLVideoElement, deviceId?: string) {
    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;

      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          await this.holistic.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe camera:', error);
      return false;
    }
  }

  public setOnResults(callback: (results: TrackingResult) => void) {
    this.onResults = callback;
  }

  public setOnBlendShapes(callback: (weights: BlendShapeWeights) => void) {
    this.onBlendShapes = callback;
  }

  public setOnFPSUpdate(callback: (fps: number) => void) {
    this.onFPSUpdate = callback;
  }

  public async switchCamera(deviceId: string, videoElement: HTMLVideoElement) {
    if (this.camera) {
      this.camera.stop();
    }
    return await this.initialize(videoElement, deviceId);
  }

  public destroy() {
    if (this.camera) {
      this.camera.stop();
    }
    this.holistic.close();
  }
}