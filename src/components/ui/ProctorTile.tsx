import React, { useRef, useEffect } from 'react';
import { Camera, Maximize } from 'lucide-react';

interface ProctorTileProps {
  stream?: MediaStream | null;
  photoUrl?: string;
  isActive?: boolean;
  isFullscreen?: boolean;
  candidateName?: string;
  className?: string;
}

export const ProctorTile: React.FC<ProctorTileProps> = ({
  stream,
  photoUrl,
  isActive = true,
  isFullscreen = true,
  candidateName,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div
      className={`bg-white rounded-[16px] border border-[#E3EAE6] p-2.5 shadow-[0_1px_2px_rgba(16,37,31,0.06)] w-48 ${className}`}
    >
      <div className="relative aspect-video rounded-[10px] overflow-hidden bg-[#10251F] flex items-center justify-center">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt="Candidate photo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/50 text-xs">
            <Camera className="w-5 h-5 mb-1 text-white/40" />
            <span>Camera Feed</span>
          </div>
        )}

        {/* Live Red Recording Indicator */}
        {isActive && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full text-[10px] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] animate-pulse" />
            <span className="font-medium">REC</span>
          </div>
        )}

        {/* Fullscreen Badge */}
        {isFullscreen && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full text-[10px] text-white/80">
            <Maximize className="w-2.5 h-2.5" />
            <span>Lock</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[#5B6B66] px-0.5">
        <span className="truncate max-w-[110px] font-medium text-[#10251F]">
          {candidateName || 'Proctoring active'}
        </span>
        <span className="text-[10px] text-[#15803D] font-semibold">Active</span>
      </div>
    </div>
  );
};
