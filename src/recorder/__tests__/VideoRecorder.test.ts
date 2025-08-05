import { VideoRecorder, AudioProcessor, RecorderOptions } from '../VideoRecorder';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// Mock FFmpeg
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    deleteFile: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
}));

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
  onerror: null,
  onstart: null,
  onpause: null,
  onresume: null
};

global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder) as any;
(global.MediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

// Mock AudioContext
const mockAudioContext = {
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  createMediaStreamDestination: jest.fn().mockReturnValue({
    stream: new MediaStream()
  }),
  createGain: jest.fn().mockReturnValue({
    gain: { value: 1 },
    connect: jest.fn()
  }),
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 2048,
    getByteTimeDomainData: jest.fn(),
    connect: jest.fn()
  }),
  close: jest.fn().mockResolvedValue(undefined)
};

global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

// Mock HTMLCanvasElement.captureStream
HTMLCanvasElement.prototype.captureStream = jest.fn().mockReturnValue(new MediaStream());

// Mock performance.now
global.performance = {
  ...global.performance,
  now: jest.fn().mockReturnValue(1000)
};

// Mock Blob
global.Blob = jest.fn().mockImplementation((chunks, options) => ({
  size: chunks.reduce((acc: number, chunk: any) => acc + (chunk.size || chunk.length || 0), 0),
  type: options?.type || 'application/octet-stream',
  chunks,
  options
}));

describe('VideoRecorder', () => {
  let recorder: VideoRecorder;
  let mockCanvas: HTMLCanvasElement;
  let mockAudioStream: MediaStream;

  beforeEach(() => {
    jest.clearAllMocks();
    recorder = new VideoRecorder();
    
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1920;
    mockCanvas.height = 1080;
    
    mockAudioStream = new MediaStream();
    Object.defineProperty(mockAudioStream, 'getAudioTracks', {
      value: jest.fn().mockReturnValue([{}]) // Mock audio track
    });

    // Reset MediaRecorder state
    mockMediaRecorder.state = 'inactive';
  });

  afterEach(() => {
    if (recorder) {
      recorder.dispose();
    }
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultRecorder = new VideoRecorder();
      expect(defaultRecorder).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const options: RecorderOptions = {
        videoBitrate: 5000000,
        audioBitrate: 192000,
        frameRate: 60,
        mimeType: 'video/webm;codecs=vp8'
      };
      
      const customRecorder = new VideoRecorder(options);
      expect(customRecorder).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize FFmpeg and AudioContext', async () => {
      await recorder.initialize();
      
      expect(FFmpeg).toHaveBeenCalled();
      expect(AudioContext).toHaveBeenCalled();
    });

    it('should handle FFmpeg initialization failure', async () => {
      const mockFFmpeg = {
        load: jest.fn().mockRejectedValue(new Error('FFmpeg load failed'))
      };
      (FFmpeg as jest.Mock).mockImplementation(() => mockFFmpeg);

      await expect(recorder.initialize()).rejects.toThrow('FFmpeg load failed');
    });
  });

  describe('startRecording', () => {
    beforeEach(async () => {
      await recorder.initialize();
    });

    it('should start video recording', async () => {
      const recordingInfo = await recorder.startRecording(mockCanvas);
      
      expect(mockCanvas.captureStream).toHaveBeenCalledWith(30);
      expect(MediaRecorder).toHaveBeenCalled();
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(100);
      expect(recordingInfo.isRecording()).toBe(true);
    });

    it('should start recording with audio stream', async () => {
      const recordingInfo = await recorder.startRecording(mockCanvas, mockAudioStream);
      
      expect(MediaRecorder).toHaveBeenCalledTimes(2); // Video and audio recorders
      expect(mockMediaRecorder.start).toHaveBeenCalledTimes(2);
    });

    it('should use custom frame rate', async () => {
      const customRecorder = new VideoRecorder({ frameRate: 60 });
      await customRecorder.initialize();
      
      await customRecorder.startRecording(mockCanvas);
      
      expect(mockCanvas.captureStream).toHaveBeenCalledWith(60);
      
      customRecorder.dispose();
    });

    it('should handle unsupported mime type', async () => {
      (MediaRecorder.isTypeSupported as jest.Mock).mockReturnValue(false);
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await recorder.startRecording(mockCanvas);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Preferred codec not supported, using default');
      expect(MediaRecorder).toHaveBeenCalledWith(expect.any(MediaStream));
      
      consoleWarnSpy.mockRestore();
    });

    it('should throw error if already recording', async () => {
      await recorder.startRecording(mockCanvas);
      
      await expect(recorder.startRecording(mockCanvas)).rejects.toThrow('Recording already in progress');
    });

    it('should handle audio stream without audio tracks', async () => {
      const emptyAudioStream = new MediaStream();
      Object.defineProperty(emptyAudioStream, 'getAudioTracks', {
        value: jest.fn().mockReturnValue([])
      });
      
      await recorder.startRecording(mockCanvas, emptyAudioStream);
      
      expect(MediaRecorder).toHaveBeenCalledTimes(1); // Only video recorder
    });

    it('should track recording duration', async () => {
      const startTime = 1000;
      const currentTime = 2000;
      
      (performance.now as jest.Mock)
        .mockReturnValueOnce(startTime)
        .mockReturnValue(currentTime);
      
      const recordingInfo = await recorder.startRecording(mockCanvas);
      
      expect(recordingInfo.duration()).toBe(1000);
    });
  });

  describe('stopRecording', () => {
    beforeEach(async () => {
      await recorder.initialize();
    });

    it('should throw error if not recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow('No recording in progress');
    });

    it('should stop video recording and return blob', async () => {
      await recorder.startRecording(mockCanvas);
      
      // Simulate recording data
      const mockData = new Blob(['video data'], { type: 'video/webm' });
      mockMediaRecorder.ondataavailable?.({ data: mockData } as any);
      
      // Simulate stop event
      const stopPromise = recorder.stopRecording();
      mockMediaRecorder.onstop?.();
      
      const result = await stopPromise;
      
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Blob);
    });

    it('should combine video and audio using FFmpeg', async () => {
      await recorder.startRecording(mockCanvas, mockAudioStream);
      
      // Simulate recording data for both video and audio
      const mockVideoData = new Blob(['video data'], { type: 'video/webm' });
      const mockAudioData = new Blob(['audio data'], { type: 'audio/webm' });
      
      // Simulate data available events
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockVideoData } as any);
        mockMediaRecorder.ondataavailable({ data: mockAudioData } as any);
      }
      
      // Simulate stop events
      const stopPromise = recorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      const result = await stopPromise;
      
      expect(fetchFile).toHaveBeenCalledWith(expect.any(Blob));
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle FFmpeg combination failure gracefully', async () => {
      const mockFFmpeg = {
        load: jest.fn().mockResolvedValue(undefined),
        writeFile: jest.fn().mockRejectedValue(new Error('Write failed')),
        exec: jest.fn(),
        readFile: jest.fn(),
        deleteFile: jest.fn()
      };
      
      (FFmpeg as jest.Mock).mockImplementation(() => mockFFmpeg);
      
      const failureRecorder = new VideoRecorder();
      await failureRecorder.initialize();
      await failureRecorder.startRecording(mockCanvas, mockAudioStream);
      
      // Simulate data
      const mockVideoData = new Blob(['video data'], { type: 'video/webm' });
      const mockAudioData = new Blob(['audio data'], { type: 'audio/webm' });
      
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockVideoData } as any);
        mockMediaRecorder.ondataavailable({ data: mockAudioData } as any);
      }
      
      const stopPromise = failureRecorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      const result = await stopPromise;
      
      // Should return video-only blob when combination fails
      expect(result).toBeInstanceOf(Blob);
      
      failureRecorder.dispose();
    });

    it('should cleanup FFmpeg files after combination', async () => {
      const mockFFMpeg = new FFmpeg();
      await recorder.startRecording(mockCanvas, mockAudioStream);
      
      const mockVideoData = new Blob(['video data'], { type: 'video/webm' });
      const mockAudioData = new Blob(['audio data'], { type: 'audio/webm' });
      
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockVideoData } as any);
        mockMediaRecorder.ondataavailable({ data: mockAudioData } as any);
      }
      
      const stopPromise = recorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      await stopPromise;
      
      expect(mockFFMpeg.deleteFile).toHaveBeenCalledWith('video.webm');
      expect(mockFFMpeg.deleteFile).toHaveBeenCalledWith('audio.webm');
      expect(mockFFMpeg.deleteFile).toHaveBeenCalledWith('output.webm');
    });
  });

  describe('applyVoiceEffect', () => {
    it('should return original audio for now', async () => {
      const mockAudioBlob = new Blob(['audio'], { type: 'audio/webm' });
      
      const result = await recorder.applyVoiceEffect(mockAudioBlob, 'robot');
      
      expect(result).toBe(mockAudioBlob);
    });

    it('should log voice preset', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockAudioBlob = new Blob(['audio'], { type: 'audio/webm' });
      
      await recorder.applyVoiceEffect(mockAudioBlob, 'deep');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Voice preset:', 'deep');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('getRecordingState', () => {
    it('should return inactive when not initialized', () => {
      const newRecorder = new VideoRecorder();
      expect(newRecorder.getRecordingState()).toBe('inactive');
    });

    it('should return recording state from MediaRecorder', async () => {
      await recorder.initialize();
      await recorder.startRecording(mockCanvas);
      
      mockMediaRecorder.state = 'recording';
      expect(recorder.getRecordingState()).toBe('recording');
      
      mockMediaRecorder.state = 'paused';
      expect(recorder.getRecordingState()).toBe('paused');
    });
  });

  describe('dispose', () => {
    it('should cleanup all resources', async () => {
      await recorder.initialize();
      await recorder.startRecording(mockCanvas, mockAudioStream);
      
      recorder.dispose();
      
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle dispose when not recording', () => {
      expect(() => {
        recorder.dispose();
      }).not.toThrow();
    });

    it('should handle dispose multiple times', async () => {
      await recorder.initialize();
      
      recorder.dispose();
      recorder.dispose();
      
      expect(mockAudioContext.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle MediaRecorder creation failure', async () => {
      (MediaRecorder as any).mockImplementation(() => {
        throw new Error('MediaRecorder not supported');
      });
      
      await recorder.initialize();
      
      await expect(recorder.startRecording(mockCanvas)).rejects.toThrow('MediaRecorder not supported');
    });

    it('should handle canvas captureStream failure', async () => {
      await recorder.initialize();
      
      mockCanvas.captureStream = jest.fn().mockImplementation(() => {
        throw new Error('captureStream failed');
      });
      
      await expect(recorder.startRecording(mockCanvas)).rejects.toThrow('captureStream failed');
    });

    it('should handle AudioContext creation failure', async () => {
      (AudioContext as any).mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });
      
      await expect(recorder.initialize()).rejects.toThrow('AudioContext not supported');
    });
  });

  describe('data collection', () => {
    beforeEach(async () => {
      await recorder.initialize();
    });

    it('should collect video data chunks', async () => {
      await recorder.startRecording(mockCanvas);
      
      const chunk1 = new Blob(['chunk1'], { type: 'video/webm' });
      const chunk2 = new Blob(['chunk2'], { type: 'video/webm' });
      
      // Simulate data available events
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: chunk1 } as any);
        mockMediaRecorder.ondataavailable({ data: chunk2 } as any);
      }
      
      const stopPromise = recorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      const result = await stopPromise;
      expect(result).toBeInstanceOf(Blob);
    });

    it('should ignore empty data chunks', async () => {
      await recorder.startRecording(mockCanvas);
      
      const emptyChunk = new Blob([], { type: 'video/webm' });
      const validChunk = new Blob(['data'], { type: 'video/webm' });
      
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: emptyChunk } as any);
        mockMediaRecorder.ondataavailable({ data: validChunk } as any);
      }
      
      const stopPromise = recorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      const result = await stopPromise;
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('FFmpeg operations', () => {
    let mockFFMpeg: jest.Mocked<FFmpeg>;

    beforeEach(() => {
      mockFFMpeg = {
        load: jest.fn().mockResolvedValue(undefined),
        writeFile: jest.fn().mockResolvedValue(undefined),
        exec: jest.fn().mockResolvedValue(undefined),
        readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
        deleteFile: jest.fn().mockResolvedValue(undefined)
      } as any;

      (FFmpeg as jest.Mock).mockImplementation(() => mockFFMpeg);
    });

    it('should execute correct FFmpeg command for video/audio combination', async () => {
      const testRecorder = new VideoRecorder();
      await testRecorder.initialize();
      await testRecorder.startRecording(mockCanvas, mockAudioStream);
      
      const mockVideoData = new Blob(['video'], { type: 'video/webm' });
      const mockAudioData = new Blob(['audio'], { type: 'audio/webm' });
      
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockVideoData } as any);
        mockMediaRecorder.ondataavailable({ data: mockAudioData } as any);
      }
      
      const stopPromise = testRecorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      await stopPromise;
      
      expect(mockFFMpeg.exec).toHaveBeenCalledWith([
        '-i', 'video.webm',
        '-i', 'audio.webm',
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-shortest',
        'output.webm'
      ]);
      
      testRecorder.dispose();
    });

    it('should handle FFmpeg exec failure', async () => {
      mockFFMpeg.exec.mockRejectedValue(new Error('FFmpeg exec failed'));
      
      const testRecorder = new VideoRecorder();
      await testRecorder.initialize();
      await testRecorder.startRecording(mockCanvas, mockAudioStream);
      
      const mockVideoData = new Blob(['video'], { type: 'video/webm' });
      const mockAudioData = new Blob(['audio'], { type: 'audio/webm' });
      
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockVideoData } as any);
        mockMediaRecorder.ondataavailable({ data: mockAudioData } as any);
      }
      
      const stopPromise = testRecorder.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
      
      // Should return video blob on FFmpeg failure
      const result = await stopPromise;
      expect(result).toBeInstanceOf(Blob);
      
      testRecorder.dispose();
    });
  });
});

describe('AudioProcessor', () => {
  let processor: AudioProcessor;
  let mockInputStream: MediaStream;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new AudioProcessor();
    mockInputStream = new MediaStream();
  });

  afterEach(() => {
    if (processor) {
      processor.dispose();
    }
  });

  describe('constructor', () => {
    it('should initialize audio nodes', () => {
      expect(AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.createMediaStreamDestination).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    });
  });

  describe('processStream', () => {
    it('should process input stream', async () => {
      const mockSourceNode = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };
      
      mockAudioContext.createMediaStreamSource.mockReturnValue(mockSourceNode);
      
      const result = await processor.processStream(mockInputStream);
      
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockInputStream);
      expect(mockSourceNode.connect).toHaveBeenCalled();
      expect(result).toBeInstanceOf(MediaStream);
    });

    it('should disconnect previous source', async () => {
      const oldSourceNode = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };
      
      const newSourceNode = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };
      
      mockAudioContext.createMediaStreamSource
        .mockReturnValueOnce(oldSourceNode)
        .mockReturnValueOnce(newSourceNode);
      
      await processor.processStream(mockInputStream);
      await processor.processStream(mockInputStream);
      
      expect(oldSourceNode.disconnect).toHaveBeenCalled();
      expect(newSourceNode.connect).toHaveBeenCalled();
    });
  });

  describe('setGain', () => {
    it('should set gain value within valid range', () => {
      const mockGainNode = {
        gain: { value: 1 },
        connect: jest.fn()
      };
      
      mockAudioContext.createGain.mockReturnValue(mockGainNode);
      
      const testProcessor = new AudioProcessor();
      
      testProcessor.setGain(0.5);
      expect(mockGainNode.gain.value).toBe(0.5);
      
      testProcessor.setGain(-0.5);
      expect(mockGainNode.gain.value).toBe(0);
      
      testProcessor.setGain(3.0);
      expect(mockGainNode.gain.value).toBe(2);
      
      testProcessor.dispose();
    });
  });

  describe('getAudioLevel', () => {
    it('should calculate audio level from analyser', () => {
      const mockAnalyserNode = {
        fftSize: 2048,
        getByteTimeDomainData: jest.fn().mockImplementation((dataArray) => {
          // Fill with sample data
          for (let i = 0; i < dataArray.length; i++) {
            dataArray[i] = 128 + Math.sin(i * 0.1) * 50;
          }
        }),
        connect: jest.fn()
      };
      
      mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode);
      
      const testProcessor = new AudioProcessor();
      const level = testProcessor.getAudioLevel();
      
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
      
      testProcessor.dispose();
    });

    it('should handle empty audio data', () => {
      const mockAnalyserNode = {
        fftSize: 2048,
        getByteTimeDomainData: jest.fn().mockImplementation((dataArray) => {
          // Fill with silence
          dataArray.fill(128);
        }),
        connect: jest.fn()
      };
      
      mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode);
      
      const testProcessor = new AudioProcessor();
      const level = testProcessor.getAudioLevel();
      
      expect(level).toBe(0);
      
      testProcessor.dispose();
    });
  });

  describe('dispose', () => {
    it('should disconnect source and close context', () => {
      const mockSourceNode = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };
      
      mockAudioContext.createMediaStreamSource.mockReturnValue(mockSourceNode);
      
      processor.processStream(mockInputStream);
      processor.dispose();
      
      expect(mockSourceNode.disconnect).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle dispose without source node', () => {
      expect(() => {
        processor.dispose();
      }).not.toThrow();
      
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle AudioContext creation failure', () => {
      (AudioContext as any).mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });
      
      expect(() => {
        new AudioProcessor();
      }).toThrow('AudioContext not supported');
    });

    it('should handle stream processing errors', async () => {
      mockAudioContext.createMediaStreamSource.mockImplementation(() => {
        throw new Error('Stream processing failed');
      });
      
      await expect(processor.processStream(mockInputStream)).rejects.toThrow('Stream processing failed');
    });
  });
});