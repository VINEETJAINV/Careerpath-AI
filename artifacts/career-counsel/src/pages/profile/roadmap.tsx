import { useParams, Link, useSearch } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCareerRoadmap,
  getGetCareerRoadmapQueryKey,
  useGetCareerSuggestions,
  getGetCareerSuggestionsQueryKey,
  useGetCareerResources,
  getGetCareerResourcesQueryKey,
  useGenerateCareerResources,
  useUpdateRoadmapProgress,
  useGetRoadmapProgress,
  getGetRoadmapProgressQueryKey,
  useCreateProgressPost,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Map as MapIcon,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  ExternalLink,
  Sparkles,
  Youtube,
  Globe,
  BookMarked,
  Wrench,
  Award,
  FileText,
  Trophy,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  course: <BookOpen className="h-4 w-4 text-blue-500" />,
  youtube: <Youtube className="h-4 w-4 text-red-500" />,
  book: <BookMarked className="h-4 w-4 text-purple-500" />,
  tool: <Wrench className="h-4 w-4 text-orange-500" />,
  website: <Globe className="h-4 w-4 text-green-500" />,
  certification: <Award className="h-4 w-4 text-amber-500" />,
  documentation: <FileText className="h-4 w-4 text-gray-500" />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 border-green-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

export default function Roadmap() {
  const params = useParams();
  const id = Number(params.id);
  const search = useSearch();
  const careerParam = new URLSearchParams(search).get("career") ?? undefined;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sharingMilestone, setSharingMilestone] = useState<number | null>(null);

  const { data: roadmap, isLoading } = useGetCareerRoadmap(
    id,
    careerParam ? { career: careerParam } : {},
    {
      query: {
        enabled: !!id,
        queryKey: getGetCareerRoadmapQueryKey(id, careerParam ? { career: careerParam } : {}),
      },
    }
  );

  const { data: suggestions } = useGetCareerSuggestions(id, {
    query: { enabled: !!id, queryKey: getGetCareerSuggestionsQueryKey(id) },
  });

  const matchedCareer = suggestions?.find(
    (s) => s.careerTitle === (roadmap?.targetCareer ?? careerParam)
  );
  const careerId = matchedCareer?.id;

  const { data: resources, isLoading: resourcesLoading } = useGetCareerResources(
    id,
    careerId ?? 0,
    { query: { enabled: !!careerId, queryKey: getGetCareerResourcesQueryKey(id, careerId ?? 0) } }
  );

  const generateResources = useGenerateCareerResources();

  const { data: progress } = useGetRoadmapProgress(
    id,
    careerParam ? { career: careerParam } : {},
    {
      query: {
        enabled: !!id,
        queryKey: getGetRoadmapProgressQueryKey(id, careerParam ? { career: careerParam } : {}),
      },
    }
  );

  const updateProgress = useUpdateRoadmapProgress();
  const createPost = useCreateProgressPost();

  const isCompleted = (milestoneIndex: number, phaseIndex: number) => {
    return progress?.some(
      (p) =>
        p.milestoneIndex === milestoneIndex &&
        p.phaseIndex === phaseIndex &&
        p.completed
    ) ?? false;
  };

  const handleToggle = (milestoneIndex: number, phaseIndex: number, currentlyDone: boolean) => {
    if (!roadmap?.targetCareer) return;
    const newCompleted = !currentlyDone;
    updateProgress.mutate(
      {
        id,
        data: {
          careerTitle: roadmap.targetCareer,
          milestoneIndex,
          phaseIndex,
          completed: newCompleted,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetRoadmapProgressQueryKey(id, careerParam ? { career: careerParam } : {}),
          });
          if (newCompleted) setSharingMilestone(milestoneIndex);
        },
      }
    );
  };

  const handleShareMilestone = (milestone: { title: string; phase: number }) => {
    if (!id) return;
    createPost.mutate(
      {
        id,
        data: {
          content: `Just completed Phase ${milestone.phase}: "${milestone.title}" on my ${roadmap?.targetCareer ?? "career"} journey! 🎉`,
          postType: "milestone_complete",
        },
      },
      {
        onSuccess: () => {
          setSharingMilestone(null);
          toast({ title: "Shared to community feed!", description: "Your progress is now visible to the community." });
        },
        onError: () => {
          toast({ title: "Could not share", description: "Log in to share progress to the feed.", variant: "destructive" });
          setSharingMilestone(null);
        },
      }
    );
  };

  const handleGenerateResources = () => {
    if (!careerId) return;
    generateResources.mutate(
      { id, careerId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetCareerResourcesQueryKey(id, careerId),
          });
          toast({ title: "Learning plan generated!", description: "Curated resources for your career path." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to generate resources.", variant: "destructive" });
        },
      }
    );
  };

  const completedCount = progress?.filter((p) => p.completed).length ?? 0;
  const totalCount = roadmap?.milestones?.length ?? 0;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <MapIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold">Your Action Plan</h1>
          {isLoading ? (
            <Skeleton className="h-6 w-64 mx-auto" />
          ) : (
            <p className="text-xl text-muted-foreground">
              Roadmap to{" "}
              <span className="font-bold text-foreground">{roadmap?.targetCareer}</span> (
              {roadmap?.totalDuration})
            </p>
          )}
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} phases done
              </span>
            </div>
          )}
        </div>

        <Tabs defaultValue="roadmap">
          <TabsList className="w-full">
            <TabsTrigger value="roadmap" className="flex-1">
              <MapIcon className="h-4 w-4 mr-2" /> Roadmap
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" /> Where to Learn
            </TabsTrigger>
          </TabsList>

          {/* Roadmap tab */}
          <TabsContent value="roadmap">
            <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 space-y-10 pb-12 mt-6">
              {isLoading
                ? [1, 2, 3].map((i) => (
                    <div key={i} className="ml-8 relative">
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ))
                : roadmap?.milestones?.map((milestone, index) => {
                    const done = isCompleted(index, milestone.phase);
                    const justCompleted = sharingMilestone === index;
                    return (
                      <div key={index} className="ml-8 relative">
                        <div
                          className={`absolute -left-[41px] top-4 h-6 w-6 rounded-full border-4 border-background transition-colors ${
                            done ? "bg-green-500" : "bg-primary"
                          }`}
                        />
                        <Card className={`border shadow-sm ${done ? "opacity-80" : ""}`}>
                          <CardHeader className="bg-muted/20 border-b pb-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <Badge
                                  className="mb-2 bg-primary/10 text-primary hover:bg-primary/20"
                                  variant="secondary"
                                >
                                  Phase {milestone.phase} • {milestone.duration}
                                </Badge>
                                <CardTitle className="text-2xl font-display">
                                  {milestone.title}
                                </CardTitle>
                              </div>
                              <Button
                                size="sm"
                                variant={done ? "default" : "outline"}
                                className={done ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                                onClick={() => handleToggle(index, milestone.phase, done)}
                                disabled={updateProgress.isPending}
                              >
                                {done ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Done
                                  </>
                                ) : (
                                  <>
                                    <Circle className="h-4 w-4 mr-1" /> Mark Done
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-4">
                            <p className="text-muted-foreground leading-relaxed">
                              {milestone.description}
                            </p>
                            <div>
                              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                                Action Items
                              </h4>
                              <ul className="space-y-2">
                                {milestone.actions?.map((action, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <span className="text-foreground font-medium">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {justCompleted && (
                              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <Trophy className="h-5 w-5 text-green-600 shrink-0" />
                                <p className="text-sm text-green-700 font-medium flex-1">
                                  Phase completed! Share your progress with the community?
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => setSharingMilestone(null)}
                                  >
                                    Skip
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="text-xs h-7 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleShareMilestone(milestone)}
                                    disabled={createPost.isPending}
                                  >
                                    Share 🎉
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
            </div>
          </TabsContent>

          {/* Where to Learn tab */}
          <TabsContent value="learn" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold">Where to Learn</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  AI-curated resources to help you become a{" "}
                  <span className="font-medium">{roadmap?.targetCareer}</span>
                </p>
              </div>
              <Button
                onClick={handleGenerateResources}
                disabled={generateResources.isPending || !careerId}
                variant={resources?.length ? "outline" : "default"}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateResources.isPending
                  ? "Generating..."
                  : resources?.length
                  ? "Refresh Plan"
                  : "Generate Learning Plan"}
              </Button>
            </div>

            {!careerId && !isLoading && (
              <Card className="border-dashed border-2 text-center py-10">
                <CardContent>
                  <p className="text-muted-foreground">
                    Complete your assessment first to unlock the learning plan.
                  </p>
                </CardContent>
              </Card>
            )}

            {resourcesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : resources && resources.length > 0 ? (
              <>
                {["beginner", "intermediate", "advanced"].map((level) => {
                  const grouped = resources.filter((r) => r.difficulty === level);
                  if (!grouped.length) return null;
                  return (
                    <div key={level}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            level === "beginner"
                              ? "bg-green-500"
                              : level === "intermediate"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        />
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {grouped.map((resource) => (
                          <Card
                            key={resource.id}
                            className="border hover:border-primary/40 hover:shadow-sm transition-all"
                          >
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                  {RESOURCE_ICONS[resource.resourceType] ?? (
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm leading-tight">
                                    {resource.title}
                                  </p>
                                  {resource.platform && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {resource.platform}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {resource.difficulty && (
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
                                        DIFFICULTY_COLORS[resource.difficulty] ?? ""
                                      }`}
                                    >
                                      {resource.difficulty}
                                    </span>
                                  )}
                                  <span
                                    className={`text-xs font-medium ${
                                      resource.isFree ? "text-green-600" : "text-muted-foreground"
                                    }`}
                                  >
                                    {resource.isFree ? "Free" : "Paid"}
                                  </span>
                                </div>
                              </div>
                              {resource.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {resource.description}
                                </p>
                              )}
                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                >
                                  Visit <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Also show ungrouped */}
                {resources.filter((r) => !r.difficulty).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resources
                      .filter((r) => !r.difficulty)
                      .map((resource) => (
                        <Card
                          key={resource.id}
                          className="border hover:border-primary/40 hover:shadow-sm transition-all"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {RESOURCE_ICONS[resource.resourceType] ?? (
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{resource.title}</p>
                                {resource.platform && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {resource.platform}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`text-xs font-medium shrink-0 ${
                                  resource.isFree ? "text-green-600" : "text-muted-foreground"
                                }`}
                              >
                                {resource.isFree ? "Free" : "Paid"}
                              </span>
                            </div>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {resource.description}
                              </p>
                            )}
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                              >
                                Visit <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </>
            ) : careerId ? (
              <Card className="border-dashed border-2 text-center py-14">
                <CardContent>
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No learning plan yet</p>
                  <p className="text-muted-foreground mt-2 mb-4">
                    Click "Generate Learning Plan" to get AI-curated courses, books, and resources
                    specifically for your career path.
                  </p>
                  <Button onClick={handleGenerateResources} disabled={generateResources.isPending}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generateResources.isPending ? "Generating..." : "Generate Learning Plan"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8 border-t">
          <Link href={`/profile/${id}/results`}>
            <Button variant="outline" size="lg" data-testid="btn-back-results">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
            </Button>
          </Link>
          <Link href={`/chat`}>
            <Button size="lg" className="px-8" data-testid="btn-talk-coach">
              Talk to AI Coach <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
