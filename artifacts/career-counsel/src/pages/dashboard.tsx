import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getMyProfile,
  getGetMyProfileQueryKey,
  useGetProfileSummary,
  useGetFollowedCareers,
  useGetRoadmapProgress,
  useGetCareerSuggestions,
  useCreateAssessment,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Map as MapIcon,
  ArrowRight,
  Play,
  Users,
  Zap,
  BookOpen,
  Trophy,
  ChevronRight,
  BarChart3,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [profileId, setProfileId] = useState<number | null>(null);

  // ── Load the user's profile from the server after login ──
  const { data: myProfile, isLoading: loadingProfile } = useQuery({
    queryKey: getGetMyProfileQueryKey(),
    queryFn: getMyProfile,
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (myProfile) {
      setProfileId(myProfile.id);
      localStorage.setItem("lastProfileId", String(myProfile.id));
    }
  }, [myProfile]);

  // ── Load all dashboard data once we know the profileId ──
  const { data: summary, isLoading: isLoadingSummary } = useGetProfileSummary(profileId ?? 0);
  const { data: followedCareers } = useGetFollowedCareers(profileId ?? 0);
  const { data: progress } = useGetRoadmapProgress(profileId ?? 0);
  const { data: suggestions } = useGetCareerSuggestions(profileId ?? 0);
  const createAssessment = useCreateAssessment();

  const handleStartAssessment = () => {
    if (!profileId) return;
    createAssessment.mutate(
      { data: { profileId } },
      {
        onSuccess: () => setLocation(`/profile/${profileId}/assessment`),
        onError: () =>
          toast({ title: "Error", description: "Failed to start assessment.", variant: "destructive" }),
      }
    );
  };

  const completedMilestones =
    progress?.filter((p) => p.status === "completed" || p.completed).length ?? 0;
  const totalMilestones = progress?.length ?? 0;
  const overallPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const recentMilestones =
    progress
      ?.filter((p) => p.status === "completed" || p.completed)
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
      .slice(0, 3) ?? [];

  const primary = followedCareers?.find((c) => c.isPrimary === 1) ?? followedCareers?.[0];

  // ── Not logged in ──
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-xl py-20 px-4 text-center">
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-12 pb-8 space-y-6">
              <Target className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-2xl font-display font-bold">Welcome to CareerPath AI</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create a profile, take the AI assessment, and get a personalised career roadmap.
              </p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Link href="/profile/new">
                  <Button className="w-full" size="lg">
                    Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Already have a profile? Log in from the top right.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Loading profile from server ──
  if (loadingProfile) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border shadow-sm"><CardContent className="pt-6"><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  // ── Logged in but no profile yet ──
  if (!myProfile) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-xl py-20 px-4 text-center">
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-12 pb-8 space-y-6">
              <MapIcon className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-2xl font-display font-bold">Create Your First Profile</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                To get personalised career guidance, we need to know a bit about you.
              </p>
              <Link href="/profile/new">
                <Button size="lg">
                  Build Your Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Full Dashboard ──
  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {isLoadingSummary ? <Skeleton className="h-9 w-48" /> : `Welcome back, ${summary?.name ?? "there"}`}
            </h1>
            <p className="text-muted-foreground mt-1">Your career command centre.</p>
          </div>
          {summary && (
            <Badge variant={summary.assessmentCompleted ? "default" : "secondary"} className="text-sm px-3 py-1">
              {summary.assessmentCompleted ? "Assessment Completed" : "Assessment Pending"}
            </Badge>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallPercent}%</p>
                  <p className="text-xs text-muted-foreground">Roadmap Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{followedCareers?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Careers Tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedMilestones}</p>
                  <p className="text-xs text-muted-foreground">Milestones Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary?.totalConversations ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Coach Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Status + Primary Career */}
          <div className="lg:col-span-2 space-y-8">
            {/* Career Status / CTA */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Career Readiness
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
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-muted-foreground">Primary Career</h3>
                        <p className="text-2xl font-display font-bold text-primary mt-1">
                          {primary?.careerTitle ?? summary.topCareerMatch ?? "No career selected"}
                        </p>
                        {summary.compatibilityScore && (
                          <p className="text-sm mt-1">
                            <span className="font-semibold text-green-600">{summary.compatibilityScore}%</span> compatibility
                          </p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-muted-foreground">Overall Progress</h3>
                        <div className="mt-2">
                          <Progress value={overallPercent} className="h-2" />
                          <p className="text-sm text-muted-foreground mt-1">
                            {completedMilestones} of {totalMilestones} milestones completed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => setLocation(`/profile/${profileId}/results`)}>
                        View Results
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/profile/${profileId}/roadmap`)}
                      >
                        <MapIcon className="mr-2 h-4 w-4" /> Roadmap
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/compare-careers`)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" /> Compare
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Ready to find your path?</h3>
                      <p className="text-muted-foreground mt-2">
                        Take the assessment to unlock career recommendations, roadmaps, and learning resources.
                      </p>
                    </div>
                    <Button size="lg" onClick={handleStartAssessment} disabled={createAssessment.isPending}>
                      <Play className="mr-2 h-4 w-4" />
                      {createAssessment.isPending ? "Starting..." : "Start Assessment"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Followed Careers */}
            {followedCareers && followedCareers.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapIcon className="h-5 w-5 text-primary" />
                    Followed Career Paths
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {followedCareers.map((career) => {
                    const careerProgress = progress?.filter((p) => p.careerTitle === career.careerTitle) ?? [];
                    const done = careerProgress.filter((p) => p.status === "completed" || p.completed).length;
                    const total = careerProgress.length || 1;
                    const pct = Math.round((done / total) * 100);
                    return (
                      <div
                        key={career.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/profile/${profileId}/roadmap?career=${encodeURIComponent(career.careerTitle)}`)}
                      >
                        <div className="flex items-center gap-3">
                          {career.isPrimary === 1 && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                          <div>
                            <p className="font-medium">{career.careerTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {done}/{total} milestones done
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <Progress value={pct} className="h-1.5" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Recent Milestones */}
            {recentMilestones.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Recently Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {recentMilestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phase {m.phaseIndex + 1} Milestone {m.milestoneIndex + 1}</p>
                        <p className="text-xs text-muted-foreground">{m.careerTitle}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Quick Actions + Shortcuts */}
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/chat")}>
                  Talk to AI Coach <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation(`/profile/${profileId}/skills`)}>
                  <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Skill Tracker</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation(`/compare-careers`)}>
                  <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Compare Careers</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/community/leaderboard")}>
                  <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Leaderboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Continue Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {suggestions && suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {suggestions.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/profile/${profileId}/roadmap?career=${encodeURIComponent(s.careerTitle)}`)}
                      >
                        <p className="text-sm font-medium">{s.careerTitle}</p>
                        <p className="text-xs text-muted-foreground">{s.compatibilityScore}% match</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete your assessment to see learning resources.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" /> Community
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/community")}>
                  Browse Members <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/community/leaderboard")}>
                  <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Leaderboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
