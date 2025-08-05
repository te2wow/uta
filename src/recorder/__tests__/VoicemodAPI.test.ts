import { 
  VoicemodAPI, 
  WebAudioVoiceEffects, 
  VoicemodPreset, 
  VoicemodStatus 
} from '../VoicemodAPI';

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  readyState: WebSocket.CONNECTING
};

global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);

// Mock AudioContext for WebAudioVoiceEffects
const mockAudioContext = {
  createOscillator: jest.fn().mockReturnValue({
    frequency: { value: 50 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  }),
  createGain: jest.fn().mockReturnValue({
    gain: { value: 0.5 },
    connect: jest.fn()
  }),
  createBiquadFilter: jest.fn().mockReturnValue({
    type: 'bandpass',
    frequency: { value: 1000 },
    Q: { value: 10 },
    gain: { value: 15 },
    connect: jest.fn()
  }),
  createDelay: jest.fn().mockReturnValue({
    delayTime: { value: 0.3 },
    connect: jest.fn()
  }),
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  createMediaStreamDestination: jest.fn().mockReturnValue({
    stream: new MediaStream(),
    connect: jest.fn()
  }),
  close: jest.fn().mockResolvedValue(undefined)
};

global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

describe('VoicemodAPI', () => {
  let voicemodAPI: VoicemodAPI;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    voicemodAPI = new VoicemodAPI(mockApiKey);
    
    // Reset fetch mock
    (fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    if (voicemodAPI) {
      voicemodAPI.disconnect();
    }
  });

  describe('constructor', () => {
    it('should initialize with default port', () => {
      const api = new VoicemodAPI(mockApiKey);
      expect(api).toBeDefined();
    });

    it('should initialize with custom port', () => {
      const api = new VoicemodAPI(mockApiKey, 8080);
      expect(api).toBeDefined();
      api.disconnect();
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      // Mock WebSocket connection
      const connectPromise = voicemodAPI.connect();
      
      // Simulate WebSocket open
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      
      await connectPromise;
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/ping',
        {
          headers: {
            'x-api-key': mockApiKey
          }
        }
      );
      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:59129/ws');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'authenticate',
          apiKey: mockApiKey
        })
      );
    });

    it('should handle connection failure', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(voicemodAPI.connect()).rejects.toThrow('Failed to connect to Voicemod Control API');
    });

    it('should handle WebSocket connection error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      const connectPromise = voicemodAPI.connect();
      
      // Simulate WebSocket error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Error('WebSocket failed') as any);
      }
      
      await expect(connectPromise).rejects.toThrow();
    });

    it('should handle fetch network error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(voicemodAPI.connect()).rejects.toThrow('Network error');
    });
  });

  describe('getVoices', () => {
    const mockVoices: VoicemodPreset[] = [
      {
        id: 'voice1',
        name: 'Robot',
        isCustom: false,
        isFavorite: true,
        icon: 'robot.png'
      },
      {
        id: 'voice2',
        name: 'Deep Voice',
        isCustom: true,
        isFavorite: false
      }
    ];

    it('should fetch voices successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          voices: mockVoices
        })
      });

      const voices = await voicemodAPI.getVoices();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/voices',
        {
          headers: {
            'x-api-key': mockApiKey
          }
        }
      );
      expect(voices).toEqual(mockVoices);
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(voicemodAPI.getVoices()).rejects.toThrow('Failed to fetch voices');
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(voicemodAPI.getVoices()).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentVoice', () => {
    it('should fetch current voice successfully', async () => {
      const mockVoiceId = 'current-voice-id';
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          voiceId: mockVoiceId
        })
      });

      const voiceId = await voicemodAPI.getCurrentVoice();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/current-voice',
        {
          headers: {
            'x-api-key': mockApiKey
          }
        }
      );
      expect(voiceId).toBe(mockVoiceId);
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(voicemodAPI.getCurrentVoice()).rejects.toThrow('Failed to fetch current voice');
    });
  });

  describe('setVoice', () => {
    const testVoiceId = 'test-voice-id';

    it('should set voice successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true
      });

      await voicemodAPI.setVoice(testVoiceId);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/current-voice',
        {
          method: 'PUT',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ voiceId: testVoiceId })
        }
      );
    });

    it('should handle set voice error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400
      });

      await expect(voicemodAPI.setVoice(testVoiceId)).rejects.toThrow('Failed to set voice');
    });
  });

  describe('enableVoiceChanger', () => {
    it('should enable voice changer successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true
      });

      await voicemodAPI.enableVoiceChanger(true);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/voice-changer',
        {
          method: 'PUT',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled: true })
        }
      );
    });

    it('should disable voice changer successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true
      });

      await voicemodAPI.enableVoiceChanger(false);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/voice-changer',
        {
          method: 'PUT',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled: false })
        }
      );
    });

    it('should handle enable error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(voicemodAPI.enableVoiceChanger(true)).rejects.toThrow('Failed to toggle voice changer');
    });
  });

  describe('getStatus', () => {
    const mockStatus: VoicemodStatus = {
      enabled: true,
      currentVoice: 'robot-voice',
      muted: false,
      monitoringEnabled: true
    };

    it('should fetch status successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStatus)
      });

      const status = await voicemodAPI.getStatus();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/status',
        {
          headers: {
            'x-api-key': mockApiKey
          }
        }
      );
      expect(status).toEqual(mockStatus);
    });

    it('should handle status fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503
      });

      await expect(voicemodAPI.getStatus()).rejects.toThrow('Failed to fetch status');
    });
  });

  describe('setMute', () => {
    it('should set mute successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true
      });

      await voicemodAPI.setMute(true);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/mute',
        {
          method: 'PUT',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ muted: true })
        }
      );
    });

    it('should handle mute error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400
      });

      await expect(voicemodAPI.setMute(false)).rejects.toThrow('Failed to set mute state');
    });
  });

  describe('playSound', () => {
    const testSoundId = 'test-sound';

    it('should play sound successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true
      });

      await voicemodAPI.playSound(testSoundId);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:59129/v1/sounds/play',
        {
          method: 'POST',
          headers: {
            'x-api-key': mockApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ soundId: testSoundId })
        }
      );
    });

    it('should handle play sound error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(voicemodAPI.playSound(testSoundId)).rejects.toThrow('Failed to play sound');
    });
  });

  describe('WebSocket event handlers', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      const connectPromise = voicemodAPI.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      await connectPromise;
    });

    describe('onVoiceChange', () => {
      it('should register voice change callback', () => {
        const callback = jest.fn();
        voicemodAPI.onVoiceChange(callback);

        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      it('should call callback on voice change message', () => {
        const callback = jest.fn();
        voicemodAPI.onVoiceChange(callback);

        // Get the registered callback
        const messageHandler = (mockWebSocket.addEventListener as jest.Mock).mock.calls
          .find(call => call[0] === 'message')[1];

        // Simulate voice change message
        const mockEvent = {
          data: JSON.stringify({
            type: 'voice-changed',
            voiceId: 'new-voice-id'
          })
        };

        messageHandler(mockEvent);

        expect(callback).toHaveBeenCalledWith('new-voice-id');
      });

      it('should ignore non-voice-change messages', () => {
        const callback = jest.fn();
        voicemodAPI.onVoiceChange(callback);

        const messageHandler = (mockWebSocket.addEventListener as jest.Mock).mock.calls
          .find(call => call[0] === 'message')[1];

        const mockEvent = {
          data: JSON.stringify({
            type: 'other-event',
            data: 'some data'
          })
        };

        messageHandler(mockEvent);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('onStatusChange', () => {
      it('should register status change callback', () => {
        const callback = jest.fn();
        voicemodAPI.onStatusChange(callback);

        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      it('should call callback on status change message', () => {
        const callback = jest.fn();
        voicemodAPI.onStatusChange(callback);

        const messageHandler = (mockWebSocket.addEventListener as jest.Mock).mock.calls
          .find(call => call[0] === 'message')[1];

        const mockStatus: VoicemodStatus = {
          enabled: false,
          currentVoice: 'normal',
          muted: true,
          monitoringEnabled: false
        };

        const mockEvent = {
          data: JSON.stringify({
            type: 'status-changed',
            status: mockStatus
          })
        };

        messageHandler(mockEvent);

        expect(callback).toHaveBeenCalledWith(mockStatus);
      });
    });

    it('should handle malformed WebSocket messages', () => {
      const callback = jest.fn();
      voicemodAPI.onVoiceChange(callback);

      const messageHandler = (mockWebSocket.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'message')[1];

      const mockEvent = {
        data: 'invalid json'
      };

      expect(() => {
        messageHandler(mockEvent);
      }).not.toThrow();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket connection', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      const connectPromise = voicemodAPI.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      await connectPromise;

      voicemodAPI.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', () => {
      expect(() => {
        voicemodAPI.disconnect();
      }).not.toThrow();
    });

    it('should handle multiple disconnects', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      const connectPromise = voicemodAPI.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      await connectPromise;

      voicemodAPI.disconnect();
      voicemodAPI.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalledTimes(1);
    });
  });
});

describe('WebAudioVoiceEffects', () => {
  let effects: WebAudioVoiceEffects;
  let mockSourceStream: MediaStream;

  beforeEach(() => {
    jest.clearAllMocks();
    effects = new WebAudioVoiceEffects();
    mockSourceStream = new MediaStream();
  });

  afterEach(() => {
    if (effects) {
      effects.dispose();
    }
  });

  describe('constructor', () => {
    it('should initialize AudioContext and effects', () => {
      expect(AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      expect(mockAudioContext.createDelay).toHaveBeenCalled();
    });
  });

  describe('getAvailableEffects', () => {
    it('should return list of available effects', () => {
      const availableEffects = effects.getAvailableEffects();
      
      expect(availableEffects).toContain('robot');
      expect(availableEffects).toContain('deep');
      expect(availableEffects).toContain('high');
      expect(availableEffects).toContain('echo');
    });

    it('should return array of strings', () => {
      const availableEffects = effects.getAvailableEffects();
      
      expect(Array.isArray(availableEffects)).toBe(true);
      availableEffects.forEach(effect => {
        expect(typeof effect).toBe('string');
      });
    });
  });

  describe('applyEffect', () => {
    beforeEach(() => {
      mockAudioContext.createMediaStreamSource.mockReturnValue({
        connect: jest.fn(),
        disconnect: jest.fn()
      });

      mockAudioContext.createMediaStreamDestination.mockReturnValue({
        stream: new MediaStream(),
        connect: jest.fn()
      });
    });

    it('should apply robot effect', () => {
      const result = effects.applyEffect(mockSourceStream, 'robot');
      
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockSourceStream);
      expect(result).toBeInstanceOf(MediaStream);
    });

    it('should apply deep effect', () => {
      const result = effects.applyEffect(mockSourceStream, 'deep');
      
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockSourceStream);
      expect(result).toBeInstanceOf(MediaStream);
    });

    it('should apply high effect', () => {
      const result = effects.applyEffect(mockSourceStream, 'high');
      
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockSourceStream);
      expect(result).toBeInstanceOf(MediaStream);
    });

    it('should apply echo effect', () => {
      const result = effects.applyEffect(mockSourceStream, 'echo');
      
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockSourceStream);
      expect(result).toBeInstanceOf(MediaStream);
    });

    it('should pass through unknown effects', () => {
      const result = effects.applyEffect(mockSourceStream, 'unknown');
      
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockSourceStream);
      expect(result).toBeInstanceOf(MediaStream);
    });

    it('should connect effect nodes correctly', () => {
      const mockSource = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };

      const mockNode1 = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };

      const mockNode2 = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };

      const mockDestination = {
        stream: new MediaStream(),
        connect: jest.fn()
      };

      mockAudioContext.createMediaStreamSource.mockReturnValue(mockSource);
      mockAudioContext.createMediaStreamDestination.mockReturnValue(mockDestination);
      
      // Mock effect nodes for robot effect
      mockAudioContext.createOscillator.mockReturnValue(mockNode1);
      mockAudioContext.createGain.mockReturnValue(mockNode2);

      effects.applyEffect(mockSourceStream, 'robot');

      expect(mockSource.connect).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should close AudioContext', () => {
      effects.dispose();
      
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle dispose multiple times', () => {
      effects.dispose();
      effects.dispose();
      
      expect(mockAudioContext.close).toHaveBeenCalledTimes(2);
    });
  });

  describe('effect initialization', () => {
    it('should configure robot effect correctly', () => {
      new WebAudioVoiceEffects();

      const oscillatorCall = (mockAudioContext.createOscillator as jest.Mock).mock.results[0].value;
      const gainCall = (mockAudioContext.createGain as jest.Mock).mock.results[0].value;
      const filterCall = (mockAudioContext.createBiquadFilter as jest.Mock).mock.results[0].value;

      expect(oscillatorCall.frequency.value).toBe(50);
      expect(gainCall.gain.value).toBe(0.5);
      expect(filterCall.type).toBe('bandpass');
      expect(filterCall.frequency.value).toBe(1000);
      expect(filterCall.Q.value).toBe(10);
    });

    it('should configure deep effect correctly', () => {
      new WebAudioVoiceEffects();

      const filterCall = (mockAudioContext.createBiquadFilter as jest.Mock).mock.results[1].value;
      expect(filterCall.type).toBe('lowshelf');
      expect(filterCall.frequency.value).toBe(200);
      expect(filterCall.gain.value).toBe(15);
    });

    it('should configure high effect correctly', () => {
      new WebAudioVoiceEffects();

      const filterCall = (mockAudioContext.createBiquadFilter as jest.Mock).mock.results[2].value;
      expect(filterCall.type).toBe('highshelf');
      expect(filterCall.frequency.value).toBe(3000);
      expect(filterCall.gain.value).toBe(15);
    });

    it('should configure echo effect correctly', () => {
      new WebAudioVoiceEffects();

      const delayCall = (mockAudioContext.createDelay as jest.Mock).mock.results[0].value;
      const feedbackCall = (mockAudioContext.createGain as jest.Mock).mock.results[1].value;
      const wetGainCall = (mockAudioContext.createGain as jest.Mock).mock.results[2].value;

      expect(delayCall.delayTime.value).toBe(0.3);
      expect(feedbackCall.gain.value).toBe(0.5);
      expect(wetGainCall.gain.value).toBe(0.3);
    });
  });

  describe('error handling', () => {
    it('should handle AudioContext creation failure', () => {
      (AudioContext as any).mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });

      expect(() => {
        new WebAudioVoiceEffects();
      }).toThrow('AudioContext not supported');
    });

    it('should handle stream processing errors', () => {
      mockAudioContext.createMediaStreamSource.mockImplementation(() => {
        throw new Error('Stream processing failed');
      });

      expect(() => {
        effects.applyEffect(mockSourceStream, 'robot');
      }).toThrow('Stream processing failed');
    });

    it('should handle node creation failures', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Node creation failed');
      });

      expect(() => {
        new WebAudioVoiceEffects();
      }).toThrow('Node creation failed');
    });
  });

  describe('effect node connections', () => {
    it('should connect nodes in correct order for echo effect', () => {
      const mockDelay = {
        delayTime: { value: 0.3 },
        connect: jest.fn()
      };

      const mockFeedback = {
        gain: { value: 0.5 },
        connect: jest.fn()
      };

      const mockWetGain = {
        gain: { value: 0.3 },
        connect: jest.fn()
      };

      mockAudioContext.createDelay.mockReturnValue(mockDelay);
      mockAudioContext.createGain
        .mockReturnValueOnce({ gain: { value: 0.5 }, connect: jest.fn() }) // robot gain
        .mockReturnValueOnce(mockFeedback) // echo feedback
        .mockReturnValueOnce(mockWetGain); // echo wet gain

      new WebAudioVoiceEffects();

      expect(mockDelay.connect).toHaveBeenCalledWith(mockFeedback);
      expect(mockFeedback.connect).toHaveBeenCalledWith(mockDelay);
      expect(mockDelay.connect).toHaveBeenCalledWith(mockWetGain);
    });
  });
});