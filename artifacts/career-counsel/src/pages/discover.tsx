import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const READY_MARKER_RE = /\{"action"\s*:\s*"ready_for_roadmap"\s*,"careers"\s*:\s*(\[.*?\])\}/s;

function extractReadyMarker(text: string): string[] | null {
  const match = text.match(READY_MARKER_RE);
  if (!match) return null;
  try {
    const careers = JSON.parse(match[1]) as string[];
    return careers.length > 0 ? careers : null;
  } catch {
    return null;
  }
}

function stripMarker(text: string): string {
  return text.replace(READY_MARKER_RE, "").trim();
}

export default function Discover() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [convId, setConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [readyCareers, setReadyCareers] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<"start" | "chat" | "done">("start");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  async function startDiscovery() {
    setPhase("chat");
    try {
      const res = await fetch("/api/discovery/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to start");
      const conv = await res.json() as { id: number };
      setConvId(conv.id);
      await sendMessage(conv.id, "__start__");
    } catch {
      toast({ title: "Could not start discovery. Please try again.", variant: "destructive" });
      setPhase("start");
    }
  }

  async function sendMessage(id: number, content: string) {
    const isStart = content === "__start__";
    const actualContent = isStart
      ? "Hi! I'd like to discover what career might be right for me. I'm not sure where to start."
      : content;

    if (!isStart) {
      setMessages(prev => [...prev, { role: "user", content: actualContent }]);
    }

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/discovery/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: actualContent }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as { content?: string; done?: boolean };
            if (parsed.content) {
              fullText += parsed.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch {
            // ignore partial JSON
          }
        }
      }

      const careers = extractReadyMarker(fullText);
      if (careers) {
        setReadyCareers(careers);
        setPhase("done");
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: stripMarker(fullText),
          };
          return updated;
        });
      }
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming || !convId) return;
    const text = input.trim();
    setInput("");
    await sendMessage(convId, text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as React.FormEvent);
    }
  }

  async function handleCreateProfile() {
    if (!convId) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/discovery/conversations/${convId}/create-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create profile");
      const data = await res.json() as { profileId: number };
      localStorage.setItem("lastProfileId", String(data.profileId));
      toast({ title: "Profile created! Taking you to your results..." });
      setLocation(`/profile/${data.profileId}/results`);
    } catch {
      toast({ title: "Failed to create your profile. Please try again.", variant: "destructive" });
      setIsCreating(false);
    }
  }

  function handleReset() {
    setConvId(null);
    setMessages([]);
    setInput("");
    setReadyCareers(null);
    setPhase("start");
  }

  if (phase === "start") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-xl w-full text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-bold">Career Discovery</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Not sure what career is right for you? Our AI will have a real conversation with you
                — about your interests, strengths, and values — then recommend specific career paths
                that genuinely fit who you are.
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-5 text-left space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What to expect:</p>
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-primary font-bold">1.</span> A natural 10-minute conversation — no long forms</li>
                <li className="flex gap-2"><span className="text-primary font-bold">2.</span> 3–5 career recommendations with honest pros and cons</li>
                <li className="flex gap-2"><span className="text-primary font-bold">3.</span> A personalised roadmap the moment you pick your path</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full text-base py-6 h-auto" onClick={startDiscovery}>
                Start the Conversation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Already know your goal?{" "}
                <a href="/profile/new" className="text-primary hover:underline font-medium">
                  Create your profile instead
                </a>
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center justify-between bg-background shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Career Discovery</p>
              <p className="text-xs text-muted-foreground">
                {phase === "done" ? "Recommendations ready" : "Discovering your path..."}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
        >
          {messages.length === 0 && (
            <div className="flex justify-center items-center h-32 text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Starting your conversation...
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 max-w-3xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:mb-3 [&>ol]:mb-3 [&>h1]:text-base [&>h2]:text-base [&>h3]:text-sm [&>strong]:font-semibold">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  )
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {phase === "done" && readyCareers && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-primary">Ready to build your roadmap</p>
                  <p className="text-sm text-muted-foreground">
                    Career{readyCareers.length > 1 ? "s" : ""} selected:{" "}
                    <span className="font-medium text-foreground">
                      {readyCareers.join(", ")}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I'll create your profile from our conversation and generate a personalised
                  step-by-step roadmap. This takes about 10 seconds.
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCreateProfile}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your profile...
                    </>
                  ) : (
                    <>
                      Build My Career Roadmap
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {phase !== "done" && (
          <div className="border-t px-4 py-4 bg-background shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                className="resize-none min-h-[52px] max-h-36 text-sm"
                rows={1}
                disabled={isStreaming || messages.length === 0}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[52px] w-[52px] shrink-0"
                disabled={!input.trim() || isStreaming || messages.length === 0}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Have a real conversation — the more you share, the better the recommendations
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
