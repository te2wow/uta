import { useState, useRef } from 'react';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import MainCanvas from './components/MainCanvas';
import Footer from './components/Footer';
import { useMediaDevices } from './hooks/useMediaDevices';

export interface AppState {
  vrmFile: File | null;
  selectedCamera: string;
  selectedMicrophone: string;
  selectedVoicePreset: string;
  isRecording: boolean;
  fps: number;
  trackingStatus: {
    face: boolean;
    pose: boolean;
    hands: boolean;
  };
}

function App() {
  const [state, setState] = useState<AppState>({
    vrmFile: null,
    selectedCamera: '',
    selectedMicrophone: '',
    selectedVoicePreset: 'none',
    isRecording: false,
    fps: 0,
    trackingStatus: {
      face: false,
      pose: false,
      hands: false,
    },
  });

  const { cameras, microphones } = useMediaDevices();
  const recordedChunks = useRef<Blob[]>([]);

  const handleFileSelect = (file: File) => {
    setState(prev => ({ ...prev, vrmFile: file }));
  };

  const handleCameraSelect = (deviceId: string) => {
    setState(prev => ({ ...prev, selectedCamera: deviceId }));
  };

  const handleMicrophoneSelect = (deviceId: string) => {
    setState(prev => ({ ...prev, selectedMicrophone: deviceId }));
  };

  const handleVoicePresetSelect = (preset: string) => {
    setState(prev => ({ ...prev, selectedVoicePreset: preset }));
  };

  const handleRecordToggle = () => {
    setState(prev => ({ ...prev, isRecording: !prev.isRecording }));
  };

  const handleDownload = async () => {
    if (recordedChunks.current.length === 0) return;
    
    try {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      
      // Process with voice modification if needed
      let finalBlob = blob;
      if (state.selectedVoicePreset !== 'none') {
        // This would integrate with RecordingService for voice processing
        console.log('Voice processing requested:', state.selectedVoicePreset);
        // finalBlob = await recordingService.processWithVoicemod(blob, state.selectedVoicePreset);
      }
      
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vrm-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const updateFPS = (fps: number) => {
    setState(prev => ({ ...prev, fps }));
  };

  const updateTrackingStatus = (status: Partial<AppState['trackingStatus']>) => {
    setState(prev => ({
      ...prev,
      trackingStatus: { ...prev.trackingStatus, ...status },
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <SidePanel
          cameras={cameras}
          microphones={microphones}
          selectedCamera={state.selectedCamera}
          selectedMicrophone={state.selectedMicrophone}
          selectedVoicePreset={state.selectedVoicePreset}
          isRecording={state.isRecording}
          onFileSelect={handleFileSelect}
          onCameraSelect={handleCameraSelect}
          onMicrophoneSelect={handleMicrophoneSelect}
          onVoicePresetSelect={handleVoicePresetSelect}
          onRecordToggle={handleRecordToggle}
          onDownload={handleDownload}
          hasRecording={recordedChunks.current.length > 0}
        />
        
        <MainCanvas
          vrmFile={state.vrmFile}
          selectedCamera={state.selectedCamera}
          isRecording={state.isRecording}
          onFPSUpdate={updateFPS}
          onTrackingUpdate={updateTrackingStatus}
          recordedChunks={recordedChunks}
        />
      </div>
      
      <Footer
        fps={state.fps}
        trackingStatus={state.trackingStatus}
      />
    </div>
  );
}

export default App
