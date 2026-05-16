import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus, MessageSquare, Trash2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function ChatIndex() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: conversations, isLoading, refetch } = useListOpenaiConversations();
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const handleNewChat = () => {
    createConv.mutate({ data: { title: "Career Coaching Session" } }, {
      onSuccess: (conv) => {
        setLocation(`/chat/${conv.id}`);
      },
      onError: () => {
        toast({ title: "Failed to start chat", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Chat deleted" });
        refetch();
      }
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">AI Career Coach</h1>
            <p className="text-muted-foreground mt-2">
              Ask questions, practice interviews, or get advice on your roadmap.
            </p>
          </div>
          <Button onClick={handleNewChat} disabled={createConv.isPending} size="lg" data-testid="btn-new-chat">
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            New Conversation
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-muted-foreground">Recent Conversations</h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No conversations yet.</p>
              <Button variant="link" onClick={handleNewChat} className="mt-2">Start your first chat</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {conversations?.map(conv => (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium group-hover:text-primary transition-colors">{conv.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={(e) => handleDelete(conv.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
