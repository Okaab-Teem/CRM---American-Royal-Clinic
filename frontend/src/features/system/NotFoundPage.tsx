import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you are looking for does not exist.</p>
        <Link to="/dashboard">
          <Button className="mt-4">Go to dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
