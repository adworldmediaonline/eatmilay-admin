"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function isEmailNotVerifiedError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("email not verified") || error.code === "EMAIL_NOT_VERIFIED";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedFlow, setUnverifiedFlow] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    setUnverifiedFlow(false);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: `${typeof window !== "undefined" ? window.location.origin : ""}`,
    });
    setLoading(false);
    if (error) {
      if (isEmailNotVerifiedError(error)) {
        setUnverifiedFlow(true);
        return;
      }
      toast.error("Invalid credentials");
      return;
    }
    if (data) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleSendVerificationCode() {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setResendLoading(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setResendLoading(false);
    if (error) {
      toast.error("Could not send verification code. Please try again.");
      return;
    }
    toast.success("Verification code sent. Check your email.");
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    router.refresh();
  }

  function handleDismissUnverifiedFlow() {
    setUnverifiedFlow(false);
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access the admin panel</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          {unverifiedFlow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Please verify your email before signing in. We can send you a new verification code.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={resendLoading}
                  onClick={handleSendVerificationCode}
                >
                  {resendLoading ? "Sending..." : "Send verification code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resendLoading}
                  onClick={handleDismissUnverifiedFlow}
                >
                  Dismiss
                </Button>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="text-center text-sm text-primary underline-offset-4 hover:underline"
                >
                  Go to verification page
                </Link>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
