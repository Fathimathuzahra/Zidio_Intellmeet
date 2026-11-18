import { VideoTile } from "./VideoTile";

// Define a placeholder type for a participant.
// This will be replaced with a real type from the WebRTC/Socket logic.
type Participant = {
  id: string;
  name: string;
  stream: MediaStream;
  isMuted: boolean;
};

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  localName: string;
  isLocalMuted: boolean;
}

export const ParticipantGrid = ({ 
  participants, 
  localStream,
  localName,
  isLocalMuted
}: ParticipantGridProps) => {
  const allParticipants = localStream 
    ? [{ id: "local", name: localName, stream: localStream, isMuted: isLocalMuted }, ...participants] 
    : participants;

  return (
    <div className="grid h-full w-full grid-cols-1 auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {allParticipants.map((participant) => (
        <VideoTile
          key={participant.id}
          stream={participant.stream}
          name={participant.name}
          isMuted={participant.isMuted}
          isLocal={participant.id === "local"}
        />
      ))}
    </div>
  );
};
