import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCareerSuggestions,
  getGetCareerSuggestionsQueryKey,
  useGetProfileSummary,
  getGetProfileSummaryQueryKey,
  useGetProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Results() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const { data: summary, isLoading: isLoadingSummary } = useGetProfileSummary(id, {
    query: { enabled: !!id, queryKey: getGetProfileSummaryQueryKey(id) }
  });

  const { data: profile } = useGetProfile(id, {
    query: { enabled: !!id, queryKey: getGetProfileQueryKey(id) }
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useGetCareerSuggestions(id, {
    query: { enabled: !!id, queryKey: getGetCareerSuggestionsQueryKey(id) }
  });

  const topSuggestion = suggestions?.[0];
  const alternativeSuggestions = suggestions?.slice(1) ?? [];

  const userSkills = (profile?.skills ?? "")
    .split(/[,;\n]/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const getSkillMatch = (requiredSkills: string[]) => {
    if (!requiredSkills.length || !userSkills.length) return { have: [], missing: [], percent: 0 };
    const have = requiredSkills.filter(s =>
      userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
    );
    const missing = requiredSkills.filter(s => !have.includes(s));
    const percent = Math.round((have.length / requiredSkills.length) * 100);
    return { have, missing, percent };
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-12">

        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold">Your Career Blueprint</h1>
          <p className="text-xl text-muted-foreground">
            Here is the honest analysis of your strengths, gaps, and best paths forward.
          </p>
        </div>

        {/* Top Match + Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-primary text-primary-foreground border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary-foreground/80 text-sm uppercase tracking-widest font-semibold">
                Top Recommended Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-12 w-64 bg-primary-foreground/20" />
              ) : (
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                    {summary?.topCareerMatch ?? topSuggestion?.careerTitle ?? "—"}
                  </h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-primary-foreground/20 px-4 py-2 rounded-lg font-bold text-lg">
                      {summary?.compatibilityScore ?? topSuggestion?.compatibilityScore ?? 0}% Match
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setLocation(`/profile/${id}/roadmap`)}
                      data-testid="btn-view-roadmap"
                    >
                      View Roadmap <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  {topSuggestion && (
                    <p className="text-primary-foreground/80 text-base leading-relaxed">
                      {topSuggestion.description}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {topSuggestion ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md p-3">
                    <DollarSign className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Salary Range</p>
                      <p>{topSuggestion.salaryRange}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md p-3">
                    <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Time to Achieve</p>
                      <p>{topSuggestion.timeToAchieve}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skill Analysis for Top Career */}
        {topSuggestion && (
          <Card className="border-2">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Skill Gap Analysis — {topSuggestion.careerTitle}
              </CardTitle>
              <CardDescription>
                How your current skills stack up against what this career demands
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {(() => {
                const { have, missing, percent } = getSkillMatch(topSuggestion.requiredSkills ?? []);
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Skill Readiness</span>
                        <span className={percent >= 60 ? "text-green-600" : percent >= 30 ? "text-amber-600" : "text-red-600"}>
                          {percent}% match
                        </span>
                      </div>
                      <Progress
                        value={percent}
                        className="h-3"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-green-700">
                          <CheckCircle2 className="h-4 w-4" /> Skills You Have
                        </h4>
                        {have.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {have.map((s, i) => (
                              <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{s}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Add your skills in your profile to see matches
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-red-700">
                          <AlertTriangle className="h-4 w-4" /> Skills to Develop
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {(missing.length > 0 ? missing : topSuggestion.requiredSkills ?? []).map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
                          <Zap className="h-4 w-4" /> All Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {(topSuggestion.requiredSkills ?? []).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Pros & Cons for Top Career */}
        {topSuggestion && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-4 w-4" /> What works in your favour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(topSuggestion.pros ?? []).map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-red-200 bg-red-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" /> What you need to be honest about
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(topSuggestion.cons ?? []).map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alternative Paths */}
        {alternativeSuggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold">Alternative Paths</h3>
            {isLoadingSuggestions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alternativeSuggestions.map((sug) => {
                  const isExpanded = expandedCard === sug.id;
                  const { have, missing, percent } = getSkillMatch(sug.requiredSkills ?? []);
                  return (
                    <Card key={sug.id} className="border shadow-sm flex flex-col" data-testid={`card-career-${sug.id}`}>
                      <CardHeader className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl font-display">{sug.careerTitle}</CardTitle>
                          <Badge
                            variant="secondary"
                            className={`font-bold text-sm ${
                              sug.compatibilityScore >= 70
                                ? "bg-green-100 text-green-700"
                                : sug.compatibilityScore >= 50
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {sug.compatibilityScore}%
                          </Badge>
                        </div>
                        <CardDescription className="text-sm mt-2 leading-relaxed">{sug.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 flex-1 space-y-3">
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{sug.salaryRange}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sug.timeToAchieve}</span>
                        </div>

                        {/* Skill readiness mini-bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Skill readiness</span>
                            <span>{percent}%</span>
                          </div>
                          <Progress value={percent} className="h-1.5" />
                        </div>

                        {isExpanded && (
                          <div className="space-y-3 pt-2 border-t">
                            <div>
                              <p className="text-xs font-bold text-green-700 mb-1">Pros</p>
                              <ul className="space-y-1">
                                {(sug.pros ?? []).map((pro, i) => (
                                  <li key={i} className="text-xs flex gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-red-700 mb-1">Cons</p>
                              <ul className="space-y-1">
                                {(sug.cons ?? []).map((con, i) => (
                                  <li key={i} className="text-xs flex gap-1.5">
                                    <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-bold mb-1">Required Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {(sug.requiredSkills ?? []).map((s, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-7"
                          onClick={() => setExpandedCard(isExpanded ? null : sug.id)}
                          data-testid={`btn-expand-${sug.id}`}
                        >
                          {isExpanded ? (
                            <><ChevronUp className="h-3 w-3 mr-1" /> Show Less</>
                          ) : (
                            <><ChevronDown className="h-3 w-3 mr-1" /> Pros, Cons & Skills</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center pt-4">
          <Button
            size="lg"
            onClick={() => setLocation(`/profile/${id}/roadmap`)}
            data-testid="btn-go-roadmap"
          >
            Build My Roadmap <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation(`/chat`)}
            data-testid="btn-go-chat"
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            Talk to AI Coach
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
