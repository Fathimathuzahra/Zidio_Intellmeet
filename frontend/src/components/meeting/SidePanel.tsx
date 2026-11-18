import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidePanel = ({ isOpen, onClose }: SidePanelProps) => {
  if (!isOpen) return null;

  return (
    <aside className="relative flex h-full w-96 flex-col border-l bg-background shadow-lg animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Collaboration Panel</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted p-0">
          <TabsTrigger value="chat" className="rounded-none">Chat</TabsTrigger>
          <TabsTrigger value="transcription" className="rounded-none">Transcription</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none">Notes</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="chat" className="p-4">
            <h3 className="text-md font-medium">Meeting Chat</h3>
            <p className="text-sm text-muted-foreground mt-2">Chat functionality will be integrated here.</p>
          </TabsContent>

          <TabsContent value="transcription" className="p-4">
            <h3 className="text-md font-medium">Live Transcription</h3>
            <p className="text-sm text-muted-foreground mt-2">AI transcription will appear here.</p>
          </TabsContent>

          <TabsContent value="notes" className="p-4">
            <h3 className="text-md font-medium">Shared Notes</h3>
            <p className="text-sm text-muted-foreground mt-2">Collaborative notes will be here.</p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
};
