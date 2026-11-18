import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, ScreenShare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MeetingControlsProps = {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
  onToggleScreenShare: () => void;
};

export const MeetingControls = ({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onLeave,
  onToggleChat,
  onToggleScreenShare,
}: MeetingControlsProps) => {
  return (
    <div className="flex items-center justify-center space-x-4 p-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMute}
        className={cn("rounded-full h-12 w-12", { "bg-destructive": isMuted })}
      >
        {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleCamera}
        className={cn("rounded-full h-12 w-12", { "bg-destructive": isCameraOff })}
      >
        {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleScreenShare}
        className="rounded-full h-12 w-12"
      >
        <ScreenShare className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleChat}
        className="rounded-full h-12 w-12"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={onLeave}
        className="rounded-full h-12 w-12"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
};
