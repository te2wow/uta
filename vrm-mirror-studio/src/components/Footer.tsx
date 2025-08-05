import React from 'react';

interface FooterProps {
  fps: number;
  trackingStatus: {
    face: boolean;
    pose: boolean;
    hands: boolean;
  };
}

const Footer: React.FC<FooterProps> = ({ fps, trackingStatus }) => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* FPS Display */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">FPS:</span>
            <span className={`text-sm font-mono ${
              fps > 24 ? 'text-green-400' : fps > 15 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {fps.toFixed(1)}
            </span>
          </div>

          {/* Tracking Status Indicators */}
          <div className="flex items-center space-x-4">
            <TrackingIndicator label="Face" active={trackingStatus.face} />
            <TrackingIndicator label="Pose" active={trackingStatus.pose} />
            <TrackingIndicator label="Hands" active={trackingStatus.hands} />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-sm text-gray-400">
          {Object.values(trackingStatus).some(v => v) 
            ? 'Tracking Active' 
            : 'Waiting for Camera...'}
        </div>
      </div>
    </footer>
  );
};

interface TrackingIndicatorProps {
  label: string;
  active: boolean;
}

const TrackingIndicator: React.FC<TrackingIndicatorProps> = ({ label, active }) => {
  return (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 rounded-full ${
        active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
      }`} />
      <span className={`text-xs ${active ? 'text-gray-300' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
};

export default Footer;