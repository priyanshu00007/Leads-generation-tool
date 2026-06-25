"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <div>
          <h2 className="font-display text-2xl">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || "An unexpected error occurred in the pipeline."}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
