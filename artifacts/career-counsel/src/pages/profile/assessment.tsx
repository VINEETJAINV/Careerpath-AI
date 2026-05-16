import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetAssessment,
  getGetAssessmentQueryKey,
  useSubmitAssessment
} from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export default function Assessment() {
  const params = useParams();
  const assessmentId = Number(params.id);
  const { data: assessment, isLoading } = useGetAssessment(assessmentId, {
    query: { enabled: !!assessmentId, queryKey: getGetAssessmentQueryKey(assessmentId) }
  });

  const submitAssessment = useSubmitAssessment();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-3xl py-12 px-4 space-y-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-3xl py-12 px-4 text-center">
          <p className="text-muted-foreground">No assessment questions found.</p>
        </div>
      </AppLayout>
    );
  }

  const questions = [...assessment.questions].sort((a, b) => a.orderIndex - b.orderIndex);
  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const rawAnswer = answers[currentQuestion.id] ?? "";
  const isAnswered = (() => {
    if (currentQuestion.questionType === "multiple_select") {
      const selected = rawAnswer ? rawAnswer.split("|").filter(Boolean) : [];
      return selected.length > 0;
    }
    if (currentQuestion.questionType === "scale") {
      return true;
    }
    return rawAnswer.trim() !== "";
  })();

  const setAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const toggleMultiSelect = (option: string) => {
    const current = answers[currentQuestion.id] ?? "";
    const selected = current ? current.split("|").filter(Boolean) : [];
    const exists = selected.includes(option);
    const updated = exists
      ? selected.filter(o => o !== option)
      : [...selected, option];
    setAnswer(updated.join("|"));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: Number(questionId),
      answer,
    }));

    submitAssessment.mutate({ id: assessmentId, data: { answers: formattedAnswers } }, {
      onSuccess: () => {
        toast({ title: "Assessment submitted — analysing your results..." });
        setLocation(`/profile/${assessment.profileId}/results`);
      },
      onError: () => {
        toast({ title: "Error submitting assessment", variant: "destructive" });
      }
    });
  };

  const renderQuestionInput = () => {
    if (currentQuestion.questionType === "multiple_choice") {
      let options: string[] = [];
      try { options = JSON.parse(currentQuestion.options ?? "[]"); } catch { options = []; }

      return (
        <RadioGroup
          value={answers[currentQuestion.id] ?? ""}
          onValueChange={setAnswer}
          className="space-y-3 mt-6"
        >
          {options.map((opt, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 bg-muted/20 p-4 rounded-lg border border-transparent hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setAnswer(opt)}
            >
              <RadioGroupItem value={opt} id={`opt-${idx}`} data-testid={`radio-${idx}`} />
              <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (currentQuestion.questionType === "multiple_select") {
      let options: string[] = [];
      try { options = JSON.parse(currentQuestion.options ?? "[]"); } catch { options = []; }
      const selected = (answers[currentQuestion.id] ?? "").split("|").filter(Boolean);

      return (
        <div className="space-y-3 mt-6">
          <p className="text-sm text-muted-foreground font-medium">Select all that apply</p>
          {options.map((opt, idx) => {
            const isSelected = selected.includes(opt);
            return (
              <div
                key={idx}
                onClick={() => toggleMultiSelect(opt)}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/20 hover:border-primary/30"
                }`}
                data-testid={`checkbox-opt-${idx}`}
              >
                <Checkbox
                  id={`multi-${idx}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleMultiSelect(opt)}
                />
                <Label htmlFor={`multi-${idx}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                {isSelected && <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Selected</Badge>}
              </div>
            );
          })}
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{selected.length} selected</p>
          )}
        </div>
      );
    }

    if (currentQuestion.questionType === "scale") {
      const val = answers[currentQuestion.id] ? Number(answers[currentQuestion.id]) : 5;
      return (
        <div className="mt-8 space-y-8">
          <div className="text-center">
            <span className="text-6xl font-display font-bold text-primary">{val}</span>
            <span className="text-2xl text-muted-foreground">/10</span>
          </div>
          <Slider
            value={[val]}
            max={10}
            min={1}
            step={1}
            onValueChange={(vals) => setAnswer(vals[0].toString())}
            data-testid="slider-scale"
            className="mt-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>1 — Not at all</span>
            <span>10 — Absolutely</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <Textarea
          placeholder="Type your answer here..."
          value={answers[currentQuestion.id] ?? ""}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[150px] resize-none text-base p-4"
          data-testid="textarea-text"
        />
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-12 px-4">
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 shadow-md">
          <CardHeader className="bg-muted/10 pb-8 border-b">
            <div className="flex items-start gap-3">
              <span className="text-sm font-bold text-primary bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 mt-1">
                {currentIndex + 1}
              </span>
              <CardTitle className="text-2xl leading-relaxed font-display">
                {currentQuestion.questionText}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-10">
            {renderQuestionInput()}
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/30 border-t py-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              data-testid="btn-prev"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!isAnswered || submitAssessment.isPending}
                size="lg"
                data-testid="btn-submit"
              >
                {submitAssessment.isPending ? "Analysing..." : "Submit Assessment"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isAnswered}
                data-testid="btn-next"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              data-testid={`dot-${idx}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                idx === currentIndex
                  ? "bg-primary"
                  : answers[questions[idx].id]
                  ? "bg-primary/40"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
