import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetProfileSummary, 
  getGetProfileSummaryQueryKey,
  useCreateAssessment,
  useGetAssessment
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Target, Map as MapIcon, BrainCircuit, ArrowRight, Play, Users, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfileDashboard() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: summary, isLoading: isLoadingSummary } = useGetProfileSummary(id, {
    query: { enabled: !!id, queryKey: getGetProfileSummaryQueryKey(id) }
  });

  const createAssessment = useCreateAssessment();

  const handleStartAssessment = () => {
    createAssessment.mutate({ data: { profileId: id } }, {
      onSuccess: (assessment) => {
        setLocation(`/profile/${id}/assessment`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to start assessment.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-5xl py-12 px-4 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {isLoadingSummary ? <Skeleton className="h-9 w-64" /> : `Welcome back, ${summary?.name}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your career command center.
            </p>
          </div>
          {summary && (
            <Badge variant={summary.assessmentCompleted ? "default" : "secondary"} className="text-sm px-3 py-1">
              {summary.assessmentCompleted ? "Assessment Completed" : "Assessment Pending"}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Action / Status Card */}
          <Card className="md:col-span-2 border-2 shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-6">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingSummary ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : summary?.assessmentCompleted ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground">Top Career Match</h3>
                    <p className="text-3xl font-display font-bold text-primary mt-1">
                      {summary.topCareerMatch || "Analyzing..."}
                    </p>
                    {summary.compatibilityScore && (
                      <p className="text-sm mt-2">
                        <span className="font-semibold text-green-600">{summary.compatibilityScore}%</span> compatibility score
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setLocation(`/profile/${id}/results`)} data-testid="btn-view-results">
                      View Full Results
                    </Button>
                    <Button variant="outline" onClick={() => setLocation(`/profile/${id}/roadmap`)} data-testid="btn-view-roadmap">
                      Career Roadmap
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Ready to find your path?</h3>
                    <p className="text-muted-foreground mt-2">
                      Take our comprehensive career assessment. We'll analyze your skills, interests, and experience to find the perfect career fit.
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleStartAssessment} 
                    disabled={createAssessment.isPending}
                    data-testid="btn-start-assessment"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {createAssessment.isPending ? "Starting..." : "Start Assessment"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoadingSummary ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Coaching Sessions</p>
                    <p className="text-2xl font-bold font-display">{summary?.totalConversations || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Activity</p>
                    <p className="text-base font-medium">
                      {summary?.lastActivity ? new Date(summary.lastActivity).toLocaleDateString() : "Just now"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setLocation('/chat')}
                    data-testid="btn-open-coach"
                  >
                    Talk to AI Coach
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setLocation(`/profile/${id}/skills`)}
                    data-testid="btn-skills"
                  >
                    <span className="flex items-center gap-2"><Zap className="h-4 w-4" />Skill Tracker</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setLocation(`/community`)}
                    data-testid="btn-community"
                  >
                    <span className="flex items-center gap-2"><Users className="h-4 w-4" />Community</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
