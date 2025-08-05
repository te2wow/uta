// Voicemod Control API integration
// Note: This requires Voicemod to be installed and running with Control API enabled

export interface VoicemodPreset {
  id: string;
  name: string;
  icon?: string;
  isCustom: boolean;
  isFavorite: boolean;
}

export interface VoicemodStatus {
  enabled: boolean;
  currentVoice: string;
  muted: boolean;
  monitoringEnabled: boolean;
}

export class VoicemodAPI {
  private baseUrl: string;
  private apiKey: string;
  private ws: WebSocket | null = null;

  constructor(apiKey: string, port = 59129) {
    this.baseUrl = `http://localhost:${port}/v1`;
    this.apiKey = apiKey;
  }

  async connect(): Promise<void> {
    // Test connection
    const response = await fetch(`${this.baseUrl}/ping`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to connect to Voicemod Control API');
    }

    // Setup WebSocket for real-time updates
    this.ws = new WebSocket(`ws://localhost:59129/ws`);
    
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('WebSocket not initialized'));

      this.ws.onopen = () => {
        // Authenticate
        this.ws!.send(JSON.stringify({
          action: 'authenticate',
          apiKey: this.apiKey
        }));
        resolve();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  async getVoices(): Promise<VoicemodPreset[]> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    return data.voices;
  }

  async getCurrentVoice(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/current-voice`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch current voice');
    }

    const data = await response.json();
    return data.voiceId;
  }

  async setVoice(voiceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/current-voice`, {
      method: 'PUT',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voiceId })
    });

    if (!response.ok) {
      throw new Error('Failed to set voice');
    }
  }

  async enableVoiceChanger(enable: boolean): Promise<void> {
    const response = await fetch(`${this.baseUrl}/voice-changer`, {
      method: 'PUT',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled: enable })
    });

    if (!response.ok) {
      throw new Error('Failed to toggle voice changer');
    }
  }

  async getStatus(): Promise<VoicemodStatus> {
    const response = await fetch(`${this.baseUrl}/status`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    return await response.json();
  }

  async setMute(mute: boolean): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mute`, {
      method: 'PUT',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ muted: mute })
    });

    if (!response.ok) {
      throw new Error('Failed to set mute state');
    }
  }

  async playSound(soundId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sounds/play`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ soundId })
    });

    if (!response.ok) {
      throw new Error('Failed to play sound');
    }
  }

  onVoiceChange(callback: (voiceId: string) => void) {
    if (!this.ws) return;

    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'voice-changed') {
        callback(data.voiceId);
      }
    });
  }

  onStatusChange(callback: (status: VoicemodStatus) => void) {
    if (!this.ws) return;

    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status-changed') {
        callback(data.status);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Fallback voice effects using Web Audio API when Voicemod is not available
export class WebAudioVoiceEffects {
  private audioContext: AudioContext;
  private effects: Map<string, AudioNode[]> = new Map();

  constructor() {
    this.audioContext = new AudioContext();
    this.initializeEffects();
  }

  private initializeEffects() {
    // Robot voice effect
    const robotEffect = () => {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      oscillator.frequency.value = 50;
      gain.gain.value = 0.5;
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 10;

      return [oscillator, gain, filter];
    };

    // Deep voice effect
    const deepEffect = () => {
      const pitchShift = this.audioContext.createBiquadFilter();
      pitchShift.type = 'lowshelf';
      pitchShift.frequency.value = 200;
      pitchShift.gain.value = 15;

      return [pitchShift];
    };

    // High pitch effect
    const highEffect = () => {
      const pitchShift = this.audioContext.createBiquadFilter();
      pitchShift.type = 'highshelf';
      pitchShift.frequency.value = 3000;
      pitchShift.gain.value = 15;

      return [pitchShift];
    };

    // Echo effect
    const echoEffect = () => {
      const delay = this.audioContext.createDelay(1);
      const feedback = this.audioContext.createGain();
      const wetGain = this.audioContext.createGain();

      delay.delayTime.value = 0.3;
      feedback.gain.value = 0.5;
      wetGain.gain.value = 0.3;

      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);

      return [delay, wetGain];
    };

    this.effects.set('robot', robotEffect());
    this.effects.set('deep', deepEffect());
    this.effects.set('high', highEffect());
    this.effects.set('echo', echoEffect());
  }

  applyEffect(
    sourceStream: MediaStream,
    effectName: string
  ): MediaStream {
    const source = this.audioContext.createMediaStreamSource(sourceStream);
    const destination = this.audioContext.createMediaStreamDestination();
    const effectNodes = this.effects.get(effectName);

    if (!effectNodes || effectNodes.length === 0) {
      // No effect, pass through
      source.connect(destination);
    } else {
      // Connect effect chain
      let currentNode: AudioNode = source;
      
      for (const node of effectNodes) {
        currentNode.connect(node);
        currentNode = node;
      }
      
      currentNode.connect(destination);
    }

    return destination.stream;
  }

  getAvailableEffects(): string[] {
    return Array.from(this.effects.keys());
  }

  dispose() {
    this.audioContext.close();
  }
}