import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCommunityMembers, getGetCommunityMembersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Users, Search, CheckCircle2, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Community() {
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useGetCommunityMembers({
    query: { queryKey: getGetCommunityMembersQueryKey() },
  });

  const filtered = (members ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.topCareer ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const completed = (members ?? []).filter((m) => m.assessmentCompleted).length;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-display font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            See who else is on their career journey. Click anyone to view their full profile, roadmap, skills, and progress.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (
            <>
              <Card className="text-center py-4">
                <CardContent className="p-0">
                  <p className="text-3xl font-display font-bold text-primary">{members?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Members</p>
                </CardContent>
              </Card>
              <Card className="text-center py-4">
                <CardContent className="p-0">
                  <p className="text-3xl font-display font-bold text-green-600">{completed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Assessments Done</p>
                </CardContent>
              </Card>
              <Card className="text-center py-4">
                <CardContent className="p-0">
                  <p className="text-3xl font-display font-bold text-amber-500">
                    {(members ?? []).filter((m) => m.topCareer).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Career Paths Found</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or career path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Member list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 text-center py-16">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">
                {search ? "No members match your search" : "No members yet"}
              </p>
              <p className="text-muted-foreground mt-2">
                {search ? "Try a different name or career." : "Be the first — complete your assessment!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((member) => (
              <Link key={member.profileId} href={`/community/profile/${member.profileId}`}>
                <Card className="border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar initial */}
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                          {member.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-base group-hover:text-primary transition-colors">
                            {member.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {member.assessmentCompleted ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="h-3 w-3" /> Assessment complete
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> Assessment pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.topCareer && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground">Top match</p>
                            <Badge variant="secondary" className="mt-0.5 font-medium max-w-[180px] truncate">
                              {member.topCareer}
                            </Badge>
                            {member.compatibilityScore !== null && (
                              <p className="text-xs text-green-600 font-semibold mt-0.5 flex items-center justify-end gap-1">
                                <TrendingUp className="h-3 w-3" />{member.compatibilityScore}%
                              </p>
                            )}
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Joined {new Date().getFullYear()} · Profiles are public by default
        </p>
      </div>
    </AppLayout>
  );
}
