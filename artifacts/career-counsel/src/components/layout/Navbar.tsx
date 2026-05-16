import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-primary">CareerPath AI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/community">
            <Button variant="ghost" className="font-medium" data-testid="nav-community">Community</Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" className="font-medium" data-testid="nav-chat">Coaching</Button>
          </Link>
          <Link href="/profile/new">
            <Button variant="default" className="font-medium" data-testid="nav-new-profile">Get Started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
