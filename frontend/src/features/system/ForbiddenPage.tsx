import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold">Permission required</h1>
      <p className="mt-2 text-sm text-muted-foreground">You do not have access to this area.</p>
      <Link to="/dashboard"><Button className="mt-4">Back to dashboard</Button></Link>
    </div>
  );
}
