import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowRight, Target, BrainCircuit, Map as MapIcon } from "lucide-react";

export default function Landing() {
  return (
    <AppLayout>
      <div className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4">
          <div className="container mx-auto max-w-5xl text-center space-y-8">
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Brutally honest career guidance for the <span className="text-primary">ambitious.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              No generic advice. We analyze your real skills, find your blind spots, and build a precise roadmap to the career you actually want.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/profile/new">
                <Button size="lg" className="text-lg px-8 py-6 h-auto" data-testid="hero-cta-start">
                  Start Your Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
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
                  We dig into your background, skills, and psychology to figure out what you are actually built for.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <MapIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">Actionable Roadmaps</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Step-by-step milestones. Know exactly what skills to learn and what projects to build next.
                </p>
              </div>
              <div className="bg-card p-8 rounded-xl border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">AI Coach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stuck on a decision? Need interview prep? Talk to your dedicated career coach anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
