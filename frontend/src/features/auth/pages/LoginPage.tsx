import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { User, Shield, Briefcase, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  {
    name: "Sara Ahmed",
    role: "Sales Rep",
    email: "sara@flowcrm.local",
    password: "FlowSara123!",
    icon: User,
    color: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10",
  },
  {
    name: "Omar Hassan",
    role: "Sales Rep",
    email: "omar@flowcrm.local",
    password: "FlowOmar123!",
    icon: UserCheck,
    color: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10",
  },
  {
    name: "Mariam Saleh",
    role: "Manager",
    email: "manager@flowcrm.local",
    password: "FlowManager123!",
    icon: Briefcase,
    color: "border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10",
  },
  {
    name: "Admin",
    role: "Administrator",
    email: "admin@flowcrm.local",
    password: "FlowAdmin123!",
    icon: Shield,
    color: "border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10",
  },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "sara@flowcrm.local", password: "FlowSara123!" },
  });

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect email or password.");
    }
  }

  function selectDemoAccount(email: string, pass: string) {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", pass, { shouldValidate: true });
    setError(null);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
              AR
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">FlowCRM</span>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your clinic supplements & pipeline.</p>
        </div>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium">
            Email Address
            <Input className="mt-1" {...form.register("email")} autoComplete="email" placeholder="name@flowcrm.local" />
            {form.formState.errors.email ? (
              <span className="mt-1 block text-xs text-danger">{form.formState.errors.email.message}</span>
            ) : null}
          </label>

          <label className="block text-sm font-medium">
            Password
            <Input
              className="mt-1"
              {...form.register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
            />
            {form.formState.errors.password ? (
              <span className="mt-1 block text-xs text-danger">{form.formState.errors.password.message}</span>
            ) : null}
          </label>

          {error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full h-10 font-semibold" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-border">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Quick Fill Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => selectDemoAccount(account.email, account.password)}
                  className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${account.color}`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{account.role}</span>
                  </div>
                  <div className="text-[11px] opacity-80 truncate w-full mt-0.5">
                    {account.name}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
            Click any account above to pre-fill credentials, or sign in with your custom created user.
          </p>
        </div>
      </section>
    </main>
  );
}
