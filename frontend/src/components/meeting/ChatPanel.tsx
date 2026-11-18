import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import type { Socket } from "socket.io-client";
import type { ChatMessage as Message } from "@/types/meeting";

interface ChatPanelProps {
  roomId: string;
  socket: Socket | null;
  currentUserName: string;
  currentUserId: string;
}

export const ChatPanel = ({ roomId, socket, currentUserName, currentUserId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || sending) return;

    setSending(true);
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sender: currentUserName,
      senderId: currentUserId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isLocal: true,
    };

    socket.emit("chat-message", {
      roomId,
      message: message.text,
      sender: message.sender,
      senderId: message.senderId,
    });

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    setSending(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 pr-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-muted-foreground">
            <p className="text-xs">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isLocal = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isLocal ? "items-end" : "items-start"}`}
            >
              <div className="text-[10px] text-muted-foreground mb-0.5 px-1">
                {msg.sender} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  isLocal
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 shrink-0">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-9 text-sm"
          disabled={sending || !socket}
        />
        <Button type="submit" size="icon" disabled={sending || !socket} className="h-9 w-9 shrink-0">
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </form>
    </div>
  );
};
