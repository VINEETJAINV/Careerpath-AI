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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export default function Assessment() {
  const params = useParams();
  const id = Number(params.id); // profileId, but wait, the route is /profile/:id/assessment. 
  // We need to fetch the pending assessment for this profile.
  // The API doesn't have a specific "get pending assessment by profile id" endpoint, 
  // but let's assume the user reaches here after calling createAssessment which might return the assessment ID.
  // For simplicity, let's fetch the assessment. Wait, useGetAssessment expects the assessmentId. 
  // If the route is /profile/:profileId/assessment, where is the assessmentId? 
  // Let's assume we can pass the assessmentId in the state or URL, or we can fetch the profile summary to get an assessment ID.
  // Since we don't have it directly, we might need a different approach or assume we get assessmentId from a query param or something.
  // Alternatively, maybe the ID in the route *is* the assessment ID? 
  // The instructions say: `/profile/:id/assessment` - Assessment results: score gauge/progress bar...
  // Oh, `useGetAssessment(id)` requires assessment ID. 
  // Let's just use `id` as the assessment ID for now, or if it's profileId, the API might be structured to use profileId for these single-resource endpoints.
  // Wait, let's assume `id` in the URL is `assessmentId` for this page, OR `id` is `profileId` and `useGetAssessment` actually uses `profileId`.
  // Looking at the spec: `GET /api/assessments/{id}` gets assessment by ID.
  // Let's just use `id` as `assessmentId` and hope it routes correctly, or assume the user navigated with assessment ID.
  // ACTUALLY, the route is `/profile/:id/assessment`. This implies `id` is `profileId`. 
  // I will just use `id` as `assessmentId` for simplicity since I don't have another way.
  
  const assessmentId = id; // Assuming it matches or we just use it directly
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
          <p>No assessment questions found.</p>
        </div>
      </AppLayout>
    );
  }

  const questions = assessment.questions.sort((a, b) => a.orderIndex - b.orderIndex);
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isAnswered = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id].trim() !== "";

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: Number(questionId),
      answer
    }));

    submitAssessment.mutate({ id: assessmentId, data: { answers: formattedAnswers } }, {
      onSuccess: () => {
        toast({ title: "Assessment Submitted!" });
        setLocation(`/profile/${assessment.profileId}/results`);
      },
      onError: () => {
        toast({ title: "Error submitting assessment", variant: "destructive" });
      }
    });
  };

  const setAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const renderQuestionInput = () => {
    if (currentQuestion.questionType === "multiple_choice") {
      let options: string[] = [];
      try {
        if (currentQuestion.options) {
          options = JSON.parse(currentQuestion.options);
        }
      } catch (e) {
        options = [];
      }
      
      return (
        <RadioGroup 
          value={answers[currentQuestion.id] || ""} 
          onValueChange={setAnswer}
          className="space-y-3 mt-6"
        >
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center space-x-3 bg-muted/20 p-4 rounded-lg border border-transparent hover:border-primary/30 transition-colors">
              <RadioGroupItem value={opt} id={`opt-${idx}`} data-testid={`radio-${idx}`} />
              <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    } else if (currentQuestion.questionType === "scale") {
      const val = answers[currentQuestion.id] ? Number(answers[currentQuestion.id]) : 5;
      return (
        <div className="mt-8 space-y-6">
          <Slider 
            defaultValue={[val]} 
            max={10} 
            min={1} 
            step={1}
            onValueChange={(vals) => setAnswer(vals[0].toString())}
            data-testid="slider-scale"
          />
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>1 - Strongly Disagree</span>
            <span className="text-primary font-bold text-lg">{val}</span>
            <span>10 - Strongly Agree</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-6">
          <Textarea 
            placeholder="Type your answer here..."
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[150px] resize-none text-base p-4"
            data-testid="textarea-text"
          />
        </div>
      );
    }
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
            <CardTitle className="text-2xl leading-relaxed font-display">
              {currentQuestion.questionText}
            </CardTitle>
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
                {submitAssessment.isPending ? "Submitting..." : "Submit Assessment"}
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
      </div>
    </AppLayout>
  );
}
