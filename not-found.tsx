import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display text-4xl">404</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This page doesn&apos;t exist. Head back to the pipeline.
          </p>
        </div>
        <Link href="/">
          <Button>Go to Lead → Launch</Button>
        </Link>
      </div>
    </div>
  );
}
