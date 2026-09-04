import { Button } from "@/components/ui/button";

export function ErrorState({ title = "We couldn't load this data.", onRetry }: { title?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Something went wrong while retrieving the data.</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      ) : null}
    </div>
  );
}
