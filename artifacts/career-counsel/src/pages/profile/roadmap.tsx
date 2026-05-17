import { useParams, Link, useSearch } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetCareerRoadmap,
  getGetCareerRoadmapQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Map as MapIcon, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";

export default function Roadmap() {
  const params = useParams();
  const id = Number(params.id);
  const search = useSearch();
  const careerParam = new URLSearchParams(search).get("career") ?? undefined;

  const { data: roadmap, isLoading } = useGetCareerRoadmap(id, careerParam ? { career: careerParam } : {}, {
    query: { enabled: !!id, queryKey: getGetCareerRoadmapQueryKey(id, careerParam ? { career: careerParam } : {}) }
  });

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <MapIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold">Your Action Plan</h1>
          {isLoading ? (
            <Skeleton className="h-6 w-64 mx-auto" />
          ) : (
            <p className="text-xl text-muted-foreground">
              Roadmap to <span className="font-bold text-foreground">{roadmap?.targetCareer}</span> ({roadmap?.totalDuration})
            </p>
          )}
        </div>

        <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 space-y-12 pb-12">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="ml-8 relative">
                <Skeleton className="h-32 w-full" />
              </div>
            ))
          ) : roadmap?.milestones?.map((milestone, index) => (
            <div key={index} className="ml-8 relative">
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-4 h-6 w-6 rounded-full border-4 border-background bg-primary" />
              
              <Card className="border shadow-sm">
                <CardHeader className="bg-muted/20 border-b pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
                        Phase {milestone.phase} • {milestone.duration}
                      </Badge>
                      <CardTitle className="text-2xl font-display">{milestone.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {milestone.description}
                  </p>
                  
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Action Items</h4>
                    <ul className="space-y-3">
                      {milestone.actions?.map((action, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground font-medium">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

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
