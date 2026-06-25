import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetCommunityMembers,
  getGetCommunityMembersQueryKey,
  useGetCommunityFeed,
  getGetCommunityFeedQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronRight,
  Trophy,
  Zap,
  MessageCircle,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const POST_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  milestone_complete: {
    label: "Milestone completed",
    icon: <Trophy className="h-3.5 w-3.5" />,
    color: "text-green-600 bg-green-50 border-green-200",
  },
  skill_achieved: {
    label: "Skill achieved",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  general_update: {
    label: "Progress update",
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
};

export default function Community() {
  const [search, setSearch] = useState("");

  const { data: members, isLoading: membersLoading } = useGetCommunityMembers({
    query: { queryKey: getGetCommunityMembersQueryKey() },
  });

  const { data: feed, isLoading: feedLoading } = useGetCommunityFeed({
    query: { queryKey: getGetCommunityFeedQueryKey() },
  });

  const filtered = (members ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.topCareer ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const completed = (members ?? []).filter((m) => m.assessmentCompleted).length;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-display font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            See who else is on their career journey and follow their progress.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {membersLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (
            <>
              <Card className="text-center py-4">
                <CardContent className="p-0">
                  <p className="text-3xl font-display font-bold text-primary">{members?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Public Members</p>
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
                    {feed?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Progress Posts</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg border text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Only profiles set to <strong>Public</strong> appear here. You can control your visibility
            from your profile dashboard at any time.
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1">
              <Users className="h-4 w-4 mr-2" /> Members
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex-1">
              <Trophy className="h-4 w-4 mr-2" /> Progress Feed
            </TabsTrigger>
          </TabsList>

          {/* Members tab */}
          <TabsContent value="members" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or career path..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {membersLoading ? (
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
                    {search ? "No members match your search" : "No public members yet"}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {search
                      ? "Try a different name or career."
                      : "Be the first — set your profile to public in your dashboard!"}
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
                                <Badge
                                  variant="secondary"
                                  className="mt-0.5 font-medium max-w-[180px] truncate"
                                >
                                  {member.topCareer}
                                </Badge>
                                {member.compatibilityScore !== null && (
                                  <p className="text-xs text-green-600 font-semibold mt-0.5 flex items-center justify-end gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {member.compatibilityScore}%
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
          </TabsContent>

          {/* Progress Feed tab */}
          <TabsContent value="feed" className="space-y-4 mt-4">
            {feedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : !feed?.length ? (
              <Card className="border-dashed border-2 text-center py-16">
                <CardContent>
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No progress posts yet</p>
                  <p className="text-muted-foreground mt-2">
                    Complete roadmap milestones or skill tests to share your journey!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {feed.map((post) => {
                  const typeInfo = POST_TYPE_LABELS[post.postType] ?? POST_TYPE_LABELS["general_update"];
                  return (
                    <Card key={post.id} className="border">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                            {post.authorName[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <span className="font-semibold text-sm">{post.authorName}</span>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${typeInfo.color}`}
                              >
                                {typeInfo.icon}
                                {typeInfo.label}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
