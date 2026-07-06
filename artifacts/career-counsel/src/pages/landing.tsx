import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@workspace/replit-auth-web";
import {
  ArrowRight,
  Target,
  BrainCircuit,
  Map as MapIcon,
  BarChart3,
  Shield,
  Sparkles,
} from "lucide-react";

function LoginLink() {
  const { login } = useAuth();
  return (
    <button onClick={login} className="text-primary hover:underline font-medium">
      Log in to your dashboard
    </button>
  );
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AppLayout>
      <div className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4">
          <div className="container mx-auto max-w-5xl text-center space-y-8">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Brutally honest career guidance for the{" "}
              <span className="text-primary">ambitious.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              No generic advice. We analyze your real skills, find your blind spots, and build a
              precise roadmap to the career you actually want.
            </p>
            <div className="pt-8 flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center">
                <Link href="/discover" className="flex-1">
                  <Button
                    size="lg"
                    className="text-base px-6 py-6 h-auto w-full"
                    data-testid="hero-cta-discover"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Help me discover my path
                  </Button>
                </Link>
                <Link href="/profile/new" className="flex-1">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-6 py-6 h-auto w-full"
                    data-testid="hero-cta-start"
                  >
                    I know my goal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm text-center">
                Not sure what you want? Choose "discover" — the AI will have a real conversation with you first.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account? <LoginLink />
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Deep Assessment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-powered analysis of your skills, experience, and goals with honest strengths
                  AND weaknesses.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <MapIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Multi-Career Roadmaps</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Follow up to 3 career paths simultaneously with independent milestones and progress
                  tracking.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">AI Career Coach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time chat coaching that remembers your profile and career context across
                  sessions.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Career Comparison</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Compare salary, difficulty, timeline, and growth side-by-side before committing.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Curated Learning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-generated courses, books, and certifications with progress tracking per career
                  and skill.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Privacy First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Full control over your visibility. Stay completely private or share selectively
                  with the community.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
