import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCareerComparison,
  getGetCareerComparisonQueryKey,
  useGetCareerSuggestions,
  getGetCareerSuggestionsQueryKey,
  useFollowCareer,
  useUnfollowCareer,
  useGetFollowedCareers,
  getGetFollowedCareersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ArrowLeft,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Star,
  CheckCircle2,
  Plus,
} from "lucide-react";

export default function CompareCareers() {
  const params = useParams();
  const id = Number(params.id ?? localStorage.getItem("lastProfileId") ?? 0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comparison, isLoading: isLoadingComparison } = useGetCareerComparison(id, {
    query: { enabled: !!id },
  });

  const { data: suggestions } = useGetCareerSuggestions(id, {
    query: { enabled: !!id },
  });

  const { data: followed } = useGetFollowedCareers(id, {
    query: { enabled: !!id },
  });

  const follow = useFollowCareer();
  const unfollow = useUnfollowCareer();

  const isFollowing = (careerSuggestionId: number) =>
    followed?.some((f) => f.careerSuggestionId === careerSuggestionId && f.status === "active");

  const handleFollow = (careerSuggestionId: number, careerTitle: string) => {
    const existing = followed?.find(
      (f) => f.careerSuggestionId === careerSuggestionId && f.status === "active"
    );
    if (existing) {
      unfollow.mutate(
        { id, careerId: existing.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetFollowedCareersQueryKey(id) });
            toast({ title: "Unfollowed", description: careerTitle });
          },
          onError: () => toast({ title: "Error", variant: "destructive" }),
        }
      );
      return;
    }

    follow.mutate(
      { id, data: { careerSuggestionId, careerTitle } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFollowedCareersQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetCareerComparisonQueryKey(id) });
          toast({ title: "Now following", description: careerTitle });
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err?.response?.data?.error || "Failed to follow career.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const careers = comparison?.careers ?? [];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/dashboard`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Compare Careers
          </h1>
        </div>

        {isLoadingComparison ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border shadow-sm"><CardContent className="pt-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : careers.length === 0 ? (
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-12 pb-8 text-center space-y-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">No careers to compare</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete your assessment and follow at least two career paths to compare them.
              </p>
              <Button onClick={() => setLocation(`/profile/${id}/results`)}>View Results</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {careers.map((career: any) => (
                <Card key={career.careerTitle} className={`border-2 shadow-sm ${career.isPrimary ? "border-primary/40" : ""}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{career.careerTitle}</CardTitle>
                      {career.isPrimary === 1 && <Badge>Primary</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{career.compatibilityScore}%</span>
                      <span className="text-sm text-muted-foreground">match</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{career.salaryRange}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">{career.estimatedTimeline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{career.industryGrowth} growth</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Skills needed</p>
                      <div className="flex flex-wrap gap-1">
                        {career.requiredSkills.slice(0, 5).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> Pros
                      </p>
                      <ul className="text-sm space-y-1">
                        {career.pros.slice(0, 3).map((p: string) => (
                          <li key={p} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" /> Cons
                      </p>
                      <ul className="text-sm space-y-1">
                        {career.cons.slice(0, 3).map((c: string) => (
                          <li key={c} className="text-muted-foreground">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Follow More */}
            {suggestions && suggestions.length > careers.length && (
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">More Career Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions
                    .filter((s) => !isFollowing(s.id))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <p className="font-medium">{s.careerTitle}</p>
                          <p className="text-xs text-muted-foreground">{s.compatibilityScore}% match</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollow(s.id, s.careerTitle)}
                          disabled={follow.isPending || unfollow.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Follow
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
