import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetPublicProfile,
  useGetProfileComments,
  useAddProfileComment,
  getGetPublicProfileQueryKey,
  getGetProfileCommentsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Briefcase,
  Target,
  CheckCircle2,
  Star,
  AlertTriangle,
  TrendingUp,
  Map as MapIcon,
  MessageSquare,
  Send,
  Zap,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function PublicProfile() {
  const { id } = useParams();
  const profileId = Number(id);
  const { user, isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: profile, isLoading } = useGetPublicProfile(profileId, {
    query: { enabled: !!profileId, queryKey: getGetPublicProfileQueryKey(profileId) },
  });

  const { data: comments, isLoading: commentsLoading } = useGetProfileComments(profileId, {
    query: { enabled: !!profileId, queryKey: getGetProfileCommentsQueryKey(profileId) },
  });

  const addComment = useAddProfileComment();

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment.mutate(
      { id: profileId, data: { content: comment.trim() } },
      {
        onSuccess: () => {
          setComment("");
          queryClient.invalidateQueries({ queryKey: getGetProfileCommentsQueryKey(profileId) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl py-12 px-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
          <p className="text-xl font-semibold">Profile not found.</p>
          <Link href="/community"><Button className="mt-4">Back to Community</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const completedProgressIds = new Set(
    profile.progress.filter((p) => p.completed).map((p) => `${p.careerTitle}-${p.milestoneIndex}-${p.phaseIndex}`)
  );

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {profile.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">{profile.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" /> {profile.educationLevel}
                </span>
                {profile.fieldOfStudy && (
                  <span className="text-sm text-muted-foreground">· {profile.fieldOfStudy}</span>
                )}
                {profile.assessmentCompleted ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />Assessment Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary">Assessment Pending</Badge>
                )}
              </div>
            </div>
          </div>
          <Link href="/community">
            <Button variant="outline" size="sm">← Community</Button>
          </Link>
        </div>

        {/* Goals / Work Exp */}
        {(profile.goals || profile.workExperience) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.workExperience && (
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Briefcase className="h-3 w-3" />EXPERIENCE</p>
                  <p className="text-sm leading-relaxed">{profile.workExperience}</p>
                </CardContent>
              </Card>
            )}
            {profile.goals && (
              <Card>
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Target className="h-3 w-3" />GOALS</p>
                  <p className="text-sm leading-relaxed">{profile.goals}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Assessment result */}
        {profile.assessmentCompleted && (profile.topStrengths.length > 0 || profile.areasToImprove.length > 0) && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-amber-500" />Assessment Result
                {profile.score !== null && (
                  <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 font-bold text-base px-3">
                    {profile.score}/100
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.analysis && <p className="text-sm text-muted-foreground leading-relaxed">{profile.analysis}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.topStrengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />STRENGTHS</p>
                    <ul className="space-y-1">
                      {profile.topStrengths.map((s) => (
                        <li key={s} className="text-sm flex items-start gap-2"><span className="text-green-500 mt-0.5">·</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.areasToImprove.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />AREAS TO IMPROVE</p>
                    <ul className="space-y-1">
                      {profile.areasToImprove.map((a) => (
                        <li key={a} className="text-sm flex items-start gap-2"><span className="text-amber-500 mt-0.5">·</span>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career suggestions */}
        {profile.careerSuggestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold">Career Matches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.careerSuggestions.map((sug) => {
                const milestones = profile.progress.filter((p) => p.careerTitle === sug.careerTitle);
                const completed = milestones.filter((p) => p.completed).length;
                const hasProgress = milestones.length > 0;
                return (
                  <Card key={sug.id} className="border">
                    <CardContent className="pt-5 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-base leading-snug">{sug.careerTitle}</p>
                        <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                          <TrendingUp className="h-3 w-3 mr-1" />{sug.compatibilityScore}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{sug.description}</p>
                      {hasProgress && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span className="flex items-center gap-1"><MapIcon className="h-3 w-3" />Roadmap progress</span>
                            <span>{completed}/{milestones.length} done</span>
                          </div>
                          <Progress value={milestones.length > 0 ? (completed / milestones.length) * 100 : 0} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold">Skills</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.skills.map((skill) => (
                <Card key={skill.id} className="border">
                  <CardContent className="pt-4 pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-medium text-sm leading-snug">{skill.skillName}</p>
                      {skill.testedLevel !== null && (
                        <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    {skill.selfRating != null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Self-rated</p>
                        <Progress value={(skill.selfRating! / 10) * 100} className="h-1.5" />
                        <p className="text-xs text-right text-muted-foreground mt-0.5">{skill.selfRating}/10</p>
                      </div>
                    )}
                    {skill.testedLevel != null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tested level</p>
                        <Progress value={(skill.testedLevel! / 10) * 100} className="h-1.5 [&>div]:bg-amber-500" />
                        <p className="text-xs text-right text-amber-600 font-semibold mt-0.5">{skill.testedLevel}/10</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />Comments
            {(comments?.length ?? 0) > 0 && (
              <Badge variant="secondary">{comments!.length}</Badge>
            )}
          </h2>

          {/* Add comment */}
          <Card>
            <CardContent className="pt-4 pb-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Leave an encouraging comment or share your thoughts..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={!comment.trim() || addComment.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {addComment.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">Log in to leave a comment</p>
                  <Button variant="outline" size="sm" onClick={login}>Log In</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comment list */}
          {commentsLoading ? (
            <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (comments ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {(comments ?? []).map((c) => (
                <Card key={c.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                        {c.authorName[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{c.authorName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{c.content}</p>
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
