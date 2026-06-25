export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <div className="font-display text-lg">Lead → Launch</div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">Loading pipeline...</div>
        </div>
      </div>
    </div>
  );
}
