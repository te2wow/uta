import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface RecorderOptions {
  videoBitrate?: number;
  audioBitrate?: number;
  frameRate?: number;
  mimeType?: string;
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private audioRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private ffmpeg: FFmpeg | null = null;
  private isRecording = false;
  private startTime = 0;

  constructor(private options: RecorderOptions = {}) {
    this.options = {
      videoBitrate: 8000000, // 8 Mbps
      audioBitrate: 128000, // 128 kbps
      frameRate: 30,
      mimeType: 'video/webm;codecs=vp9',
      ...options
    };
  }

  async initialize() {
    // Initialize FFmpeg
    this.ffmpeg = new FFmpeg();
    await this.ffmpeg.load();

    // Initialize audio context
    this.audioContext = new AudioContext();
  }

  async startRecording(canvas: HTMLCanvasElement, audioStream?: MediaStream) {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.recordedChunks = [];
    this.audioChunks = [];
    this.isRecording = true;
    this.startTime = Date.now();

    // Create video stream from canvas
    const videoStream = canvas.captureStream(this.options.frameRate);

    // Setup video recorder
    const videoOptions: MediaRecorderOptions = {
      mimeType: this.options.mimeType,
      videoBitsPerSecond: this.options.videoBitrate,
    };

    if (MediaRecorder.isTypeSupported(videoOptions.mimeType!)) {
      this.mediaRecorder = new MediaRecorder(videoStream, videoOptions);
    } else {
      // Fallback to default codec
      console.warn('Preferred codec not supported, using default');
      this.mediaRecorder = new MediaRecorder(videoStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Setup audio recorder if stream provided
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      const audioOptions: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: this.options.audioBitrate,
      };

      this.audioRecorder = new MediaRecorder(audioStream, audioOptions);
      
      this.audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.audioRecorder.start(100); // Collect data every 100ms
    }

    // Start recording
    this.mediaRecorder.start(100); // Collect data every 100ms

    return {
      duration: () => Date.now() - this.startTime,
      isRecording: () => this.isRecording
    };
  }

  async stopRecording(): Promise<Blob> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    this.isRecording = false;

    // Stop recorders
    const videoPromise = new Promise<void>((resolve) => {
      this.mediaRecorder!.onstop = () => resolve();
      this.mediaRecorder!.stop();
    });

    const audioPromise = this.audioRecorder
      ? new Promise<void>((resolve) => {
          this.audioRecorder!.onstop = () => resolve();
          this.audioRecorder!.stop();
        })
      : Promise.resolve();

    await Promise.all([videoPromise, audioPromise]);

    // Create video blob
    const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });

    // If no audio, return video only
    if (this.audioChunks.length === 0) {
      return videoBlob;
    }

    // Create audio blob
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

    // Combine video and audio using FFmpeg
    return await this.combineVideoAudio(videoBlob, audioBlob);
  }

  private async combineVideoAudio(videoBlob: Blob, audioBlob: Blob): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    try {
      // Write files to FFmpeg virtual filesystem
      await this.ffmpeg.writeFile('video.webm', await fetchFile(videoBlob));
      await this.ffmpeg.writeFile('audio.webm', await fetchFile(audioBlob));

      // Combine video and audio
      await this.ffmpeg.exec([
        '-i', 'video.webm',
        '-i', 'audio.webm',
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-shortest',
        'output.webm'
      ]);

      // Read the output
      const data = await this.ffmpeg.readFile('output.webm');
      
      // Clean up
      await this.ffmpeg.deleteFile('video.webm');
      await this.ffmpeg.deleteFile('audio.webm');
      await this.ffmpeg.deleteFile('output.webm');

      return new Blob([data], { type: 'video/webm' });
    } catch (error) {
      console.error('Error combining video and audio:', error);
      // Return video only if combining fails
      return videoBlob;
    }
  }

  async applyVoiceEffect(audioBlob: Blob, voicePreset: string): Promise<Blob> {
    // This would integrate with Voicemod Control API
    // For now, return original audio
    console.log('Voice preset:', voicePreset);
    return audioBlob;
  }

  getRecordingState(): 'inactive' | 'recording' | 'paused' {
    if (!this.mediaRecorder) return 'inactive';
    return this.mediaRecorder.state as any;
  }

  dispose() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    if (this.audioRecorder && this.isRecording) {
      this.audioRecorder.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.mediaRecorder = null;
    this.audioRecorder = null;
    this.audioContext = null;
    this.ffmpeg = null;
    this.recordedChunks = [];
    this.audioChunks = [];
  }
}

// Audio processor for voice effects
export class AudioProcessor {
  private audioContext: AudioContext;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode;
  private gainNode: GainNode;
  private analyzerNode: AnalyserNode;

  constructor() {
    this.audioContext = new AudioContext();
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.gainNode = this.audioContext.createGain();
    this.analyzerNode = this.audioContext.createAnalyser();

    // Connect nodes
    this.gainNode.connect(this.analyzerNode);
    this.analyzerNode.connect(this.destinationNode);
  }

  async processStream(inputStream: MediaStream): Promise<MediaStream> {
    // Disconnect previous source if exists
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    // Create new source from input stream
    this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);
    this.sourceNode.connect(this.gainNode);

    return this.destinationNode.stream;
  }

  setGain(value: number) {
    this.gainNode.gain.value = Math.max(0, Math.min(2, value));
  }

  getAudioLevel(): number {
    const dataArray = new Uint8Array(this.analyzerNode.fftSize);
    this.analyzerNode.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / dataArray.length);
  }

  dispose() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    this.audioContext.close();
  }
}