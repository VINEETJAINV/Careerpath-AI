import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetProfileSkills,
  useAddProfileSkill,
  getGetProfileSkillsQueryKey,
  useGetSkillResources,
  getGetSkillResourcesQueryKey,
  useGenerateSkillResources,
  useCreateProgressPost,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Zap,
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ExternalLink,
  Sparkles,
  Youtube,
  Globe,
  BookMarked,
  Wrench,
  Award,
  FileText,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type SkillTestQuestion = {
  index: number;
  question: string;
  options: string[];
  correct?: string;
};

type TestResult = {
  testedLevel: number;
  summary: string;
  advice: string[];
  skillName: string;
  skillId: number;
};

type AddedSkill = {
  id: number;
  profileId: number;
  skillName: string;
  selfRating: number | null;
  testedLevel: number | null;
  testedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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

function SkillResourcesPanel({ profileId, skillId }: { profileId: number; skillId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading } = useGetSkillResources(profileId, skillId, {
    query: { queryKey: getGetSkillResourcesQueryKey(profileId, skillId) },
  });

  const generate = useGenerateSkillResources();

  const handleGenerate = () => {
    generate.mutate(
      { id: profileId, skillId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSkillResourcesQueryKey(profileId, skillId) });
          toast({ title: "Resources generated!", description: "Curated learning plan ready." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to generate resources.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!resources?.length) {
    return (
      <div className="pt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">No resources yet.</p>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generate.isPending} className="text-xs h-7">
          <Sparkles className="h-3 w-3 mr-1" />
          {generate.isPending ? "Generating..." : "Generate Resources"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Learning Resources</p>
        <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={generate.isPending} className="text-xs h-6 px-2">
          <RotateCcw className="h-3 w-3 mr-1" />
          {generate.isPending ? "..." : "Refresh"}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {resources.map((r) => (
          <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
            <div className="mt-0.5 shrink-0">
              {RESOURCE_ICONS[r.resourceType] ?? <Globe className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{r.title}</p>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {r.difficulty && (
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${DIFFICULTY_COLORS[r.difficulty] ?? ""}`}>
                      {r.difficulty}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${r.isFree ? "text-green-600" : "text-muted-foreground"}`}>
                    {r.isFree ? "Free" : "Paid"}
                  </span>
                </div>
              </div>
              {r.platform && <p className="text-xs text-muted-foreground mt-0.5">{r.platform}</p>}
              {r.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.description}</p>}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium mt-1"
                >
                  Visit <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Skills() {
  const { id } = useParams();
  const profileId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newSkill, setNewSkill] = useState("");
  const [selfRating, setSelfRating] = useState(5);
  const [adding, setAdding] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);

  // Test flow state
  const [testSkillId, setTestSkillId] = useState<number | null>(null);
  const [testSkillName, setTestSkillName] = useState("");
  const [testPhase, setTestPhase] = useState<"loading" | "questions" | "result">("loading");
  const [questions, setQuestions] = useState<SkillTestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const { data: skills, isLoading } = useGetProfileSkills(profileId, {
    query: { enabled: !!profileId, queryKey: getGetProfileSkillsQueryKey(profileId) },
  });

  const addSkill = useAddProfileSkill();
  const createPost = useCreateProgressPost();

  const handleAdd = async () => {
    if (!newSkill.trim()) return;
    setAdding(true);
    addSkill.mutate(
      { id: profileId, data: { skillName: newSkill.trim(), selfRating } },
      {
        onSuccess: () => {
          setNewSkill("");
          setSelfRating(5);
          queryClient.invalidateQueries({ queryKey: getGetProfileSkillsQueryKey(profileId) });
        },
        onSettled: () => setAdding(false),
      }
    );
  };

  const handleDelete = async (skillId: number) => {
    await fetch(`/api/profiles/${profileId}/skills/${skillId}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: getGetProfileSkillsQueryKey(profileId) });
  };

  const handleStartTest = async (skill: AddedSkill) => {
    setTestSkillId(skill.id);
    setTestSkillName(skill.skillName);
    setTestPhase("loading");
    setAnswers({});
    setTestResult(null);

    const res = await fetch(`/api/profiles/${profileId}/skills/${skill.id}/questions`);
    const data = (await res.json()) as { questions: SkillTestQuestion[] };
    setQuestions(data.questions ?? []);
    setTestPhase("questions");
  };

  const handleSubmitTest = async () => {
    if (!testSkillId) return;
    setTestLoading(true);
    const answerList = Object.entries(answers).map(([qi, answer]) => ({
      questionIndex: Number(qi),
      answer,
    }));

    const res = await fetch(`/api/profiles/${profileId}/skills/${testSkillId}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: answerList, questions }),
    });
    const result = (await res.json()) as TestResult;
    setTestResult(result);
    setTestPhase("result");
    setTestLoading(false);
    queryClient.invalidateQueries({ queryKey: getGetProfileSkillsQueryKey(profileId) });
  };

  const handleShareSkill = () => {
    if (!testResult) return;
    createPost.mutate(
      {
        id: profileId,
        data: {
          content: `Just tested my ${testResult.skillName} skills and scored ${testResult.testedLevel}/10! 💪 Time to keep improving.`,
          postType: "skill_achieved",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Shared to community feed!", description: "Your skill achievement is visible to the community." });
        },
        onError: () => {
          toast({ title: "Log in to share", description: "You need to be logged in to post to the feed.", variant: "destructive" });
        },
      }
    );
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-12 px-4 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Skill Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Rate your skills, take AI tests to verify your level, and get a personalised learning plan.
            </p>
          </div>
          <Link href={`/profile/${profileId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />Dashboard
            </Button>
          </Link>
        </div>

        {/* Add skill form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />Add a Skill
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="e.g. Python, Public Speaking, Graphic Design..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Self-rating</span>
                <span className="font-semibold">{selfRating}/10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[selfRating]}
                onValueChange={([v]) => setSelfRating(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Expert</span>
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!newSkill.trim() || adding}>
              <Plus className="h-4 w-4 mr-2" />
              {adding ? "Adding..." : "Add Skill"}
            </Button>
          </CardContent>
        </Card>

        {/* Skill list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (skills ?? []).length === 0 ? (
          <Card className="border-dashed border-2 text-center py-12">
            <CardContent>
              <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No skills added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first skill above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(skills ?? []).map((skill) => (
              <Card key={skill.id} className="border">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">{skill.skillName}</h3>
                        {skill.testedLevel !== null && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            <Zap className="h-3 w-3 mr-1" />Tested: {skill.testedLevel}/10
                          </Badge>
                        )}
                        {skill.testedAt && (
                          <span className="text-xs text-muted-foreground">
                            · tested {new Date(skill.testedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {skill.selfRating != null && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Self-rated</span>
                            <span>{skill.selfRating}/10</span>
                          </div>
                          <Progress value={(skill.selfRating! / 10) * 100} className="h-1.5" />
                        </div>
                      )}

                      {skill.testedLevel != null && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Tested level</span>
                            <span className="text-amber-600 font-semibold">{skill.testedLevel}/10</span>
                          </div>
                          <Progress
                            value={(skill.testedLevel! / 10) * 100}
                            className="h-1.5 [&>div]:bg-amber-500"
                          />
                        </div>
                      )}

                      {/* Resources panel — shown when expanded */}
                      {expandedSkill === skill.id && (
                        <SkillResourcesPanel profileId={profileId} skillId={skill.id} />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/5 text-xs"
                        onClick={() => handleStartTest(skill as AddedSkill)}
                      >
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        {skill.testedLevel !== null ? "Re-test" : "Take Test"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() =>
                          setExpandedSkill(expandedSkill === skill.id ? null : skill.id)
                        }
                      >
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        {expandedSkill === skill.id ? "Hide" : "Resources"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive text-xs"
                        onClick={() => handleDelete(skill.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Test Dialog */}
        <Dialog
          open={testSkillId !== null}
          onOpenChange={(open) => {
            if (!open) setTestSkillId(null);
          }}
        >
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />Skill Test — {testSkillName}
              </DialogTitle>
              <DialogDescription>
                {testPhase === "questions" &&
                  "Answer all questions, then submit for an honest AI assessment of your level."}
                {testPhase === "result" &&
                  "Here's your honest assessment, what to do next, and where to learn."}
              </DialogDescription>
            </DialogHeader>

            {testPhase === "loading" && (
              <div className="space-y-4 py-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <p className="text-center text-sm text-muted-foreground">Generating questions...</p>
              </div>
            )}

            {testPhase === "questions" && (
              <div className="space-y-5 py-2">
                {questions.map((q) => (
                  <div key={q.index} className="space-y-2">
                    <p className="text-sm font-medium">
                      Q{q.index + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            answers[q.index] === opt
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.index}`}
                            value={opt}
                            checked={answers[q.index] === opt}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [q.index]: opt }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                              answers[q.index] === opt
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40"
                            }`}
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full"
                  disabled={!allAnswered || testLoading}
                  onClick={handleSubmitTest}
                >
                  {testLoading ? "Evaluating..." : "Submit Answers"}
                  {!testLoading && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            )}

            {testPhase === "result" && testResult && (
              <div className="space-y-5 py-2">
                {/* Level indicator */}
                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-1">TESTED LEVEL</p>
                  <p className="text-6xl font-display font-bold text-amber-600">
                    {testResult.testedLevel}
                  </p>
                  <p className="text-sm text-amber-700">/10</p>
                  <Progress
                    value={(testResult.testedLevel / 10) * 100}
                    className="h-2 mt-3 [&>div]:bg-amber-500"
                  />
                </div>

                {/* Summary */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />HONEST ASSESSMENT
                    </p>
                    <p className="text-sm leading-relaxed">{testResult.summary}</p>
                  </CardContent>
                </Card>

                {/* Advice */}
                <div>
                  <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />WHAT TO DO NEXT
                  </p>
                  <ul className="space-y-2">
                    {testResult.advice.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 flex-wrap">
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                    onClick={() => {
                      setTestPhase("questions");
                      setAnswers({});
                      setTestResult(null);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />Retake
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                    onClick={handleShareSkill}
                    disabled={createPost.isPending}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {createPost.isPending ? "Sharing..." : "Share Result"}
                  </Button>
                  <Button
                    className="flex-1 min-w-[120px]"
                    onClick={() => {
                      if (testResult?.skillId) {
                        setExpandedSkill(testResult.skillId);
                      }
                      setTestSkillId(null);
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />Where to Learn
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
