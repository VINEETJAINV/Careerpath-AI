import { useSearch } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCommunityInsights,
  getGetCommunityInsightsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Star,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Trophy,
  Target,
} from "lucide-react";

function AnswerBar({ label, count, total, isMyAnswer }: { label: string; count: number; total: number; isMyAnswer: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`space-y-1 rounded-lg px-3 py-2 transition-colors ${isMyAnswer ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-1.5 text-foreground/80">
          {isMyAnswer && <span className="inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          {label}
        </span>
        <span className="font-semibold text-xs text-muted-foreground whitespace-nowrap ml-2">{pct}% ({count})</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isMyAnswer ? "bg-primary" : "bg-muted-foreground/30"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Community() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const profileId = params.get("profileId") ? Number(params.get("profileId")) : undefined;

  const { data, isLoading } = useGetCommunityInsights(
    profileId !== undefined ? { profileId } : {},
    { query: { queryKey: getGetCommunityInsightsQueryKey(profileId !== undefined ? { profileId } : {}) } }
  );

  const statCards = [
    { icon: Users, label: "Community Members", value: data?.totalMembers ?? "—" },
    { icon: ClipboardCheck, label: "Assessments Completed", value: data?.assessmentsCompleted ?? "—" },
    { icon: BarChart3, label: "Community Avg Score", value: data && data.assessmentsCompleted > 0 ? `${data.avgScore}/100` : "—" },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-12">

        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold">Community Insights</h1>
          <p className="text-xl text-muted-foreground">
            See how your answers and scores compare with everyone who has taken the assessment.
          </p>
          {profileId && (
            <Badge variant="secondary" className="text-sm px-4 py-1">
              Showing your answers highlighted
            </Badge>
          )}
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-2 text-center">
              <CardContent className="pt-8 pb-6">
                <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                {isLoading ? (
                  <Skeleton className="h-9 w-24 mx-auto mb-2" />
                ) : (
                  <p className="text-4xl font-display font-bold">{value}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Your Score vs Community */}
        {profileId && (
          <Card className={`border-2 ${data?.myScore !== undefined && data.myScore !== null ? "border-primary/40 bg-primary/5" : ""}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Score vs the Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex gap-12">
                  <Skeleton className="h-20 w-32" />
                  <Skeleton className="h-20 w-32" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-12 items-end">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                    <p className={`text-6xl font-display font-bold ${
                      (data?.myScore ?? 0) >= 70 ? "text-green-600"
                      : (data?.myScore ?? 0) >= 45 ? "text-amber-600"
                      : "text-red-600"
                    }`}>
                      {data?.myScore !== null && data?.myScore !== undefined ? data.myScore : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Community Average</p>
                    <p className="text-6xl font-display font-bold text-muted-foreground">{data?.avgScore ?? "—"}</p>
                  </div>
                  {data?.myScore !== null && data?.myScore !== undefined && data?.avgScore !== undefined && (
                    <div className="pb-2">
                      <Badge
                        className={`text-base px-4 py-1.5 ${
                          data.myScore > data.avgScore
                            ? "bg-green-100 text-green-700 border-green-200"
                            : data.myScore === data.avgScore
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-red-100 text-red-600 border-red-200"
                        }`}
                        variant="outline"
                      >
                        {data.myScore > data.avgScore
                          ? `${data.myScore - data.avgScore} points above average`
                          : data.myScore === data.avgScore
                          ? "Right at the average"
                          : `${data.avgScore - data.myScore} points below average`}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Score Distribution */}
        <Card className="border">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Score Distribution
            </CardTitle>
            <CardDescription>How assessment scores are spread across the community</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.scoreDistribution ?? []).map((bucket) => {
                  const total = Math.max(1, data?.assessmentsCompleted ?? 1);
                  const pct = Math.round((bucket.count / total) * 100);
                  const isMyBucket =
                    data?.myScore !== null && data?.myScore !== undefined &&
                    ((bucket.range === "0–25" && data.myScore <= 25) ||
                      (bucket.range === "26–50" && data.myScore > 25 && data.myScore <= 50) ||
                      (bucket.range === "51–75" && data.myScore > 50 && data.myScore <= 75) ||
                      (bucket.range === "76–100" && data.myScore > 75));
                  return (
                    <div key={bucket.range} className={`space-y-1 rounded-lg px-3 py-2 ${isMyBucket ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                          {isMyBucket && <span className="inline-block w-2 h-2 rounded-full bg-primary" />}
                          Score {bucket.range}
                          {isMyBucket && <Badge variant="outline" className="ml-2 text-xs border-primary/40 text-primary">You</Badge>}
                        </span>
                        <span className="text-muted-foreground">{pct}% · {bucket.count} {bucket.count === 1 ? "person" : "people"}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isMyBucket ? "bg-primary" : "bg-muted-foreground/40"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Popular Paths */}
        <Card className="border">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Most Recommended Career Paths
            </CardTitle>
            <CardDescription>What the AI suggested most often across the community</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (data?.topCareers ?? []).length === 0 ? (
              <p className="text-muted-foreground italic text-sm">No career data yet — be the first to complete an assessment.</p>
            ) : (
              (data?.topCareers ?? []).map((career, i) => (
                <div key={career.careerTitle} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <span className={`text-2xl font-display font-bold w-8 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{career.careerTitle}</p>
                    <p className="text-xs text-muted-foreground">Avg match score: {career.avgCompatibilityScore}%</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {career.count} {career.count === 1 ? "person" : "people"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Community Strengths + Areas to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-green-200 bg-green-50/20">
            <CardHeader className="border-b border-green-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Star className="h-5 w-5" /> Top Community Strengths
              </CardTitle>
              <CardDescription>Most common strengths identified by the AI across all assessments</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-2">
              {isLoading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (data?.topStrengths ?? []).length === 0 ? (
                <p className="text-muted-foreground italic text-sm">No data yet.</p>
              ) : (
                (data?.topStrengths ?? []).map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{item.count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-red-200 bg-red-50/20">
            <CardHeader className="border-b border-red-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" /> Common Areas to Improve
              </CardTitle>
              <CardDescription>What the community most needs to work on</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-2">
              {isLoading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (data?.topAreasToImprove ?? []).length === 0 ? (
                <p className="text-muted-foreground italic text-sm">No data yet.</p>
              ) : (
                (data?.topAreasToImprove ?? []).map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">{item.count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Breakdowns */}
        {((data?.questionBreakdowns ?? []).length > 0 || isLoading) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold">How Everyone Answered</h2>
              <p className="text-muted-foreground mt-1">
                Answer distributions for every question — {profileId ? "your choice is highlighted in blue" : "complete the assessment to see your answers highlighted"}.
              </p>
            </div>
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : (
              (data?.questionBreakdowns ?? []).map((q, qi) => {
                const total = q.answers.reduce((sum, a) => sum + a.count, 0);
                const myAnswerParts = q.myAnswer
                  ? q.questionType === "multiple_select"
                    ? q.myAnswer.split("|").map(s => s.trim())
                    : [q.myAnswer]
                  : [];
                return (
                  <Card key={qi} className="border">
                    <CardHeader className="bg-muted/20 border-b pb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold text-primary/60 font-display shrink-0">Q{qi + 1}</span>
                        <div>
                          <CardTitle className="text-base font-semibold leading-snug">{q.questionText}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{q.questionType.replace("_", " ")}</Badge>
                            <span className="text-xs text-muted-foreground">{total} {total === 1 ? "response" : "responses"}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      {q.answers.map((a) => (
                        <AnswerBar
                          key={a.label}
                          label={a.label}
                          count={a.count}
                          total={total}
                          isMyAnswer={myAnswerParts.includes(a.label)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (data?.assessmentsCompleted ?? 0) === 0 && (
          <Card className="border-dashed border-2 text-center py-16">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">No community data yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Be the first to complete the assessment and kick off the community insights. Once a few people have finished, patterns will start to emerge here.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
