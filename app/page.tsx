import { Suspense } from "react";
import { TopNav } from "@/components/top-nav";
import { ResizableLayout } from "@/components/resizable-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav />
      <ErrorBoundary fallbackMessage="Failed to load claims workspace">
        <Suspense fallback={null}>
          <ResizableLayout />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
