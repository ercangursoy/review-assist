import { ShieldCheck } from "lucide-react";

export function TopNav() {
  return (
    <header className="h-12 flex items-center px-3 sm:px-5 border-b border-border bg-background shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-background" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground tracking-tight">Joyful</span>
          <span className="text-border">·</span>
          <span className="text-xs text-muted-foreground">Claims Review</span>
        </div>
      </div>
    </header>
  );
}
