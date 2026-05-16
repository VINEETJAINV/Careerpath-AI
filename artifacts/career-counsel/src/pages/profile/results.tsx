import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetCareerSuggestions,
  getGetCareerSuggestionsQueryKey,
  useGetProfileSummary,
  getGetProfileSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapIcon, ArrowRight, BrainCircuit, CheckCircle2, AlertTriangle, Briefcase, Clock, DollarSign } from "lucide-react";

export default function Results() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: summary, isLoading: isLoadingSummary } = useGetProfileSummary(id, {
    query: { enabled: !!id, queryKey: getGetProfileSummaryQueryKey(id) }
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useGetCareerSuggestions(id, {
    query: { enabled: !!id, queryKey: getGetCareerSuggestionsQueryKey(id) }
  });

  // Mocking the result analysis since the endpoint only provides suggestions
  // In a real app, we would fetch the AssessmentResult
  const mockAnalysis = "Based on your assessment, you show a strong aptitude for analytical thinking and problem-solving. However, your communication skills and leadership presence need development if you want to transition into management.";
  const mockStrengths = ["Analytical Thinking", "Technical Depth", "Focus"];
  const mockWeaknesses = ["Public Speaking", "Cross-functional Communication"];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold">Your Career Blueprint</h1>
          <p className="text-xl text-muted-foreground">
            We've analyzed your profile. Here is the unvarnished truth and your best paths forward.
          </p>
        </div>

        {/* Top Match & Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-primary-foreground/80">Top Recommended Path</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-12 w-64 bg-primary-foreground/20" />
              ) : (
                <div className="space-y-2">
                  <h2 className="text-4xl md:text-5xl font-display font-bold">{summary?.topCareerMatch || "Data Scientist"}</h2>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="bg-primary-foreground/20 px-4 py-2 rounded-lg font-bold">
                      {summary?.compatibilityScore || 92}% Match
                    </div>
                    <Button variant="secondary" onClick={() => setLocation(`/profile/${id}/roadmap`)} data-testid="btn-view-roadmap">
                      View Roadmap <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-green-600 mb-2">
                  <CheckCircle2 className="h-4 w-4" /> Core Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mockStrengths.map((s, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-red-600 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Areas to Improve
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mockWeaknesses.map((s, i) => (
                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">{s}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">{mockAnalysis}</p>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold">Alternative Paths</h3>
          {isLoadingSuggestions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestions?.map((sug) => (
                <Card key={sug.id} className="border shadow-sm flex flex-col">
                  <CardHeader className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-display">{sug.careerTitle}</CardTitle>
                      <Badge variant="secondary" className="font-bold text-primary bg-primary/10">
                        {sug.compatibilityScore}% Match
                      </Badge>
                    </div>
                    <CardDescription className="text-base mt-2 line-clamp-2">{sug.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" /> {sug.salaryRange}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" /> {sug.timeToAchieve}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold mb-1 block">Pros</span>
                      <ul className="text-sm text-muted-foreground list-disc list-inside pl-4 space-y-1">
                        {sug.pros?.slice(0, 2).map((pro, i) => <li key={i}>{pro}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-sm font-semibold mb-1 block">Required Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sug.requiredSkills?.slice(0, 4).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
