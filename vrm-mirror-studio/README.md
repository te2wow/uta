# VRM Mirror Studio

A web-based VRM model viewer with real-time motion tracking using MediaPipe Holistic. Features mirror-mode tracking, dual camera views, voice changing capabilities, and video recording.

## Features

- 🎭 **VRM Model Support**: Load and display VRM models using @pixiv/three-vrm
- 🎯 **Full Body Tracking**: Real-time face, pose, and hand tracking with MediaPipe Holistic
- 🪞 **Mirror Mode**: Natural mirror-reversed movements for streaming
- 📹 **Dual Camera Views**: Main recording view + picture-in-picture back view
- 🎵 **Voice Processing**: Integration with Voicemod Control API for voice changing
- 📊 **Motion Stabilization**: OneEuroFilter and EMA smoothing for stable tracking
- 🎨 **Modern UI**: Beautiful Tailwind CSS interface with responsive design
- 🔄 **Real-time Performance**: Optimized rendering with WebWorker support

## Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- Modern web browser with WebGL and MediaDevices support
- Camera and microphone access permissions
- (Optional) Voicemod installed for voice changing features

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vrm-mirror-studio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Configuration

### MediaPipe Settings

The MediaPipe Holistic model can be configured in `src/services/MediaPipeService.ts`:

```typescript
this.holistic.setOptions({
  modelComplexity: 1,        // 0-2: Higher = more accurate but slower
  smoothLandmarks: true,     // Enable temporal smoothing
  refineFaceLandmarks: true, // Enhanced face landmark detection
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### OneEuroFilter Parameters

Motion stabilization can be tuned in `src/utils/TrackingStabilizer.ts`:

```typescript
private readonly freq = 30;        // Expected FPS
private readonly mincutoff = 1.0;  // Lower = more smoothing
private readonly beta = 0.7;       // Higher = more responsive
private readonly dcutoff = 1.0;    // Derivative cutoff frequency
```

### Voicemod API (Optional)

To enable voice changing features:

1. Install Voicemod desktop application
2. Enable the Control API in Voicemod settings
3. Configure the API endpoint in your environment

## Project Structure

```
src/
├── components/          # React UI components
│   ├── Header.tsx      # App header with title
│   ├── SidePanel.tsx   # Control panel (file selection, devices, etc.)
│   ├── MainCanvas.tsx  # Main 3D viewport and preview
│   └── Footer.tsx      # Status indicators and FPS display
├── hooks/
│   └── useMediaDevices.ts  # Media device enumeration hook
├── services/
│   └── MediaPipeService.ts # MediaPipe Holistic integration
├── utils/
│   ├── OneEuroFilter.ts    # Noise reduction filter
│   └── TrackingStabilizer.ts # Motion data stabilization
└── App.tsx             # Main application component
```

## Usage

1. **Load VRM Model**: Click "Select VRM File" and choose a .vrm model file
2. **Configure Camera**: Select your preferred camera from the dropdown
3. **Set Microphone**: Choose microphone for audio recording
4. **Select Voice Preset**: Choose voice modification preset (requires Voicemod)
5. **Start Tracking**: The system will automatically begin tracking when camera is active
6. **Record**: Click "Start Recording" to capture your performance
7. **Download**: Use "Download Recording" to save your video

## Mirror Mode Behavior

The application implements natural mirror-mode tracking:

- **Coordinate Reversal**: X-coordinates are flipped for natural movement
- **Bone Mirroring**: Left/right bones are swapped appropriately
- **Quaternion Correction**: Rotation data is properly mirrored

## Performance Optimization

- **Motion Stabilization**: OneEuroFilter reduces jitter while maintaining responsiveness
- **Efficient Rendering**: Optimized Three.js rendering pipeline
- **WebWorker Support**: Heavy computations can be offloaded (implementation ready)
- **Adaptive Quality**: MediaPipe complexity can be adjusted for performance

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 85+
- Safari 14+
- Edge 90+

## Troubleshooting

### Camera/Microphone Access Issues
- Ensure HTTPS or localhost for media device access
- Check browser permissions for camera and microphone
- Try refreshing the page and re-granting permissions

### Performance Issues
- Lower MediaPipe model complexity
- Reduce browser window size
- Close other tabs/applications
- Check if hardware acceleration is enabled

### VRM Loading Issues
- Ensure the file is a valid .vrm format
- Check file size (very large models may cause issues)
- Verify the VRM model is compatible with @pixiv/three-vrm

## Development

### Building for Production

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## API Integration

### Voicemod Control API

The application supports Voicemod voice changing through their Control API. Ensure Voicemod is running and the API is enabled.

### Custom Voice Processing

You can extend the voice processing by modifying the audio processing pipeline in the recording service.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) for VRM model support
- [MediaPipe](https://mediapipe.dev/) for real-time tracking
- [Three.js](https://threejs.org/) for 3D rendering
- [Tailwind CSS](https://tailwindcss.com/) for styling
