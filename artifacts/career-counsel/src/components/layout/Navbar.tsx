import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, LayoutDashboard, Trophy, BarChart3 } from "lucide-react";

export function Navbar() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-primary">CareerPath AI</span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          {isAuthenticated && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex font-medium" data-testid="nav-dashboard">
                  Dashboard
                </Button>
              </Link>
              <Link href="/compare-careers">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex font-medium" data-testid="nav-compare">
                  Compare
                </Button>
              </Link>
            </>
          )}
          <Link href="/community">
            <Button variant="ghost" size="sm" className="font-medium" data-testid="nav-community">Community</Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex font-medium" data-testid="nav-chat">Coaching</Button>
          </Link>
          {!isLoading && (
            isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {(user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                      {user.firstName ?? user.email ?? "Account"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Account"}</p>
                    {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/compare-careers">
                      <BarChart3 className="h-4 w-4 mr-2" />Compare Careers
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/community/leaderboard">
                      <Trophy className="h-4 w-4 mr-2" />Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile/new">
                      <User className="h-4 w-4 mr-2" />New Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="font-medium" onClick={login} data-testid="nav-login">
                  Log In
                </Button>
                <Link href="/profile/new">
                  <Button size="sm" variant="default" className="font-medium" data-testid="nav-new-profile">Get Started</Button>
                </Link>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
