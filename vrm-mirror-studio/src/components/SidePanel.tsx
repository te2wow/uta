import React, { useRef } from 'react';

interface SidePanelProps {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  selectedCamera: string;
  selectedMicrophone: string;
  selectedVoicePreset: string;
  isRecording: boolean;
  hasRecording: boolean;
  onFileSelect: (file: File) => void;
  onCameraSelect: (deviceId: string) => void;
  onMicrophoneSelect: (deviceId: string) => void;
  onVoicePresetSelect: (preset: string) => void;
  onRecordToggle: () => void;
  onDownload: () => void;
}

const voicePresets = [
  { id: 'none', name: 'No Voice Change' },
  { id: 'robot', name: 'Robot' },
  { id: 'alien', name: 'Alien' },
  { id: 'baby', name: 'Baby' },
  { id: 'deep', name: 'Deep Voice' },
  { id: 'chipmunk', name: 'Chipmunk' },
];

const SidePanel: React.FC<SidePanelProps> = ({
  cameras,
  microphones,
  selectedCamera,
  selectedMicrophone,
  selectedVoicePreset,
  isRecording,
  hasRecording,
  onFileSelect,
  onCameraSelect,
  onMicrophoneSelect,
  onVoicePresetSelect,
  onRecordToggle,
  onDownload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.vrm')) {
      onFileSelect(file);
    }
  };

  return (
    <aside className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* VRM File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            VRM Model
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vrm"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Select VRM File
          </button>
        </div>

        {/* Camera Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => onCameraSelect(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Camera</option>
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>

        {/* Microphone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Microphone
          </label>
          <select
            value={selectedMicrophone}
            onChange={(e) => onMicrophoneSelect(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Microphone</option>
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Preset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Voice Preset
          </label>
          <select
            value={selectedVoicePreset}
            onChange={(e) => onVoicePresetSelect(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {voicePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recording Controls */}
        <div className="space-y-3">
          <button
            onClick={onRecordToggle}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          {hasRecording && (
            <button
              onClick={onDownload}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Download Recording
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gray-700 rounded-lg p-4 text-sm text-gray-300">
          <p className="font-medium mb-2">Tips:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Select a VRM model file to begin</li>
            <li>Grant camera & microphone permissions</li>
            <li>Voice presets require Voicemod API</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default SidePanel;