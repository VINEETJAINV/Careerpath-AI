import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetOpenaiConversation,
  getGetOpenaiConversationQueryKey,
  useListOpenaiMessages,
  getListOpenaiMessagesQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export default function ChatView() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();

  const { data: conversation } = useGetOpenaiConversation(id, {
    query: { enabled: !!id, queryKey: getGetOpenaiConversationQueryKey(id) }
  });

  const { data: initialMessages, refetch } = useListOpenaiMessages(id, {
    query: { enabled: !!id, queryKey: getListOpenaiMessagesQueryKey(id) }
  });

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync initial messages once loaded
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages.map(m => ({ role: m.role, content: m.content })));
    }
  }, [initialMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input;
    setInput("");
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/openai/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage })
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.done) break;
              if (json.content) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content += json.content;
                  return newMessages;
                });
              }
            } catch (err) {
              console.error("SSE parse error", err);
            }
          }
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to communicate with AI.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      refetch(); // Ensure DB state is synced
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full border-x bg-muted/10">
        <div className="px-6 py-4 border-b bg-background flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-semibold text-lg">{conversation?.title || "Loading..."}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.length === 0 && !isStreaming && (
              <div className="text-center py-10 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50 text-primary" />
                <p>Hello! I'm your AI career coach. How can I help you today?</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className={`h-10 w-10 border ${msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <AvatarFallback>{msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                  <div className={`px-5 py-3 rounded-2xl ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border shadow-sm rounded-tl-sm prose prose-sm dark:prose-invert"
                  }`}>
                    {msg.role === "assistant" ? (
                      msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <span className="animate-pulse">...</span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-background border-t">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto relative">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask anything..." 
              className="flex-1 bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary h-12 px-4 rounded-full"
              disabled={isStreaming}
              data-testid="input-chat"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full shrink-0" 
              disabled={!input.trim() || isStreaming}
              data-testid="btn-send-message"
            >
              {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
