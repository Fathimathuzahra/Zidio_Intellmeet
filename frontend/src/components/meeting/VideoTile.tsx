import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream;
  name: string;
  isMuted: boolean;
  isLocal: boolean;
}

export const VideoTile = ({ stream, name, isMuted, isLocal }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-muted">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Only mute the local video to prevent echo
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
        <span className="font-semibold text-white">{name}</span>
        {isMuted && <span className="text-red-500 ml-2">(Muted)</span>}
      </div>
    </div>
  );
};
