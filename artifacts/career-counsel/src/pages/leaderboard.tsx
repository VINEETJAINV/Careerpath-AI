import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, TrendingUp, Zap, Medal } from "lucide-react";

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetLeaderboard();

  const entries = data ?? [];

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-12 px-4 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/community")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" /> Leaderboard
          </h1>
        </div>

        <p className="text-muted-foreground">
          Ranked by roadmap completion and skill test scores. Only public profiles appear here.
        </p>

        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No public members yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.profileId}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 flex justify-center">{rankIcon(entry.rank)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entry.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> {entry.roadmapCompletion}% roadmap
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {entry.skillsTested} skills
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {entry.totalScore} pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
