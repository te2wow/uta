import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface RecordingOptions {
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
}

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  // private audioRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  // private audioChunks: Blob[] = [];
  private isRecording = false;
  private ffmpeg: FFmpeg | null = null;
  private onDataAvailable: ((chunks: Blob[]) => void) | null = null;

  constructor() {
    this.initFFmpeg();
  }

  private async initFFmpeg() {
    try {
      this.ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
    }
  }

  public async startRecording(
    canvas: HTMLCanvasElement,
    audioDeviceId?: string,
    options: RecordingOptions = {}
  ): Promise<boolean> {
    if (this.isRecording) return false;

    try {
      // Setup video recording from canvas
      const canvasStream = canvas.captureStream(30);
      
      // Setup audio recording
      let audioStream: MediaStream | null = null;
      if (audioDeviceId) {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: audioDeviceId } },
          video: false
        });
      }

      // Combine streams
      const tracks = [...canvasStream.getTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }
      
      const combinedStream = new MediaStream(tracks);

      // Configure MediaRecorder
      const defaultOptions: RecordingOptions = {
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000,  // 128 kbps
        mimeType: 'video/webm;codecs=vp9,opus'
      };

      const recordingOptions = { ...defaultOptions, ...options };
      
      // Check supported MIME types
      const supportedTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];

      let selectedType = recordingOptions.mimeType;
      if (!MediaRecorder.isTypeSupported(selectedType!)) {
        selectedType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
        if (!selectedType) {
          throw new Error('No supported recording format found');
        }
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedType,
        videoBitsPerSecond: recordingOptions.videoBitsPerSecond,
        audioBitsPerSecond: recordingOptions.audioBitsPerSecond
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable([...this.recordedChunks]);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        this.isRecording = false;
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('Recording error:', event);
        this.isRecording = false;
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log('Recording started');
      return true;

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      return false;
    }
  }

  public stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm'
        });
        
        this.isRecording = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();

      // Stop all tracks
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    });
  }

  public async processWithVoicemod(
    videoBlob: Blob,
    voicePreset: string = 'none'
  ): Promise<Blob> {
    // This is a placeholder for Voicemod integration
    // In a real implementation, you would:
    // 1. Extract audio from video
    // 2. Send audio to Voicemod Control API
    // 3. Receive processed audio
    // 4. Combine with video using FFmpeg

    if (voicePreset === 'none' || !this.ffmpeg) {
      return videoBlob;
    }

    try {
      // Extract audio from video
      const videoArrayBuffer = await videoBlob.arrayBuffer();
      await this.ffmpeg.writeFile('input.webm', new Uint8Array(videoArrayBuffer));

      // Extract audio track
      await this.ffmpeg.exec([
        '-i', 'input.webm',
        '-vn', '-acodec', 'copy',
        'audio.webm'
      ]);

      // Here you would process audio with Voicemod API
      // For now, we'll apply a simple audio filter as demo
      const audioFilter = this.getAudioFilterForPreset(voicePreset);
      
      await this.ffmpeg.exec([
        '-i', 'audio.webm',
        '-af', audioFilter,
        'processed_audio.wav'
      ]);

      // Combine processed audio with original video
      await this.ffmpeg.exec([
        '-i', 'input.webm',
        '-i', 'processed_audio.wav',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-map', '0:v:0',
        '-map', '1:a:0',
        'output.mp4'
      ]);

      const outputData = await this.ffmpeg.readFile('output.mp4');
      const outputBlob = new Blob([outputData], { type: 'video/mp4' });

      // Cleanup
      await this.ffmpeg.deleteFile('input.webm');
      await this.ffmpeg.deleteFile('audio.webm');
      await this.ffmpeg.deleteFile('processed_audio.wav');
      await this.ffmpeg.deleteFile('output.mp4');

      return outputBlob;

    } catch (error) {
      console.error('Voice processing failed:', error);
      return videoBlob;
    }
  }

  private getAudioFilterForPreset(preset: string): string {
    const filters: Record<string, string> = {
      robot: 'asetrate=22050,aresample=44100,atempo=1.0',
      alien: 'asetrate=32000,aresample=44100,atempo=0.8',
      baby: 'asetrate=48000,aresample=44100,atempo=1.2',
      deep: 'asetrate=16000,aresample=44100,atempo=0.9',
      chipmunk: 'asetrate=88200,aresample=44100,atempo=1.5',
    };

    return filters[preset] || 'anull';
  }

  public setOnDataAvailable(callback: (chunks: Blob[]) => void) {
    this.onDataAvailable = callback;
  }

  public getRecordedChunks(): Blob[] {
    return [...this.recordedChunks];
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public async downloadRecording(filename?: string): Promise<void> {
    if (this.recordedChunks.length === 0) {
      throw new Error('No recording data available');
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `vrm-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  public clearRecording() {
    this.recordedChunks = [];
    // this.audioChunks = [];
  }

  public dispose() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.recordedChunks = [];
    // this.audioChunks = [];
  }
}