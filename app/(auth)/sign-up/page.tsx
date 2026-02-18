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

const USER_EXISTS_MESSAGES = [
  "User already exists",
  "User already exists. Use another email.",
];

function isUserAlreadyExistsError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return USER_EXISTS_MESSAGES.some((m) => msg.includes(m)) || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" || error.code === "USER_ALREADY_EXISTS";
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userExistsFlow, setUserExistsFlow] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const { data, error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/verify-email`,
    });
    setLoading(false);
    if (error) {
      if (isUserAlreadyExistsError(error)) {
        setUserExistsFlow(true);
        return;
      }
      toast.error(error.message ?? "Could not create account. Please try again.");
      return;
    }
    if (data) {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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
      toast.error("Could not send verification code. Please try signing in instead.");
      return;
    }
    toast.success("Verification code sent. Check your email.");
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    router.refresh();
  }

  function handleDismissUserExistsFlow() {
    setUserExistsFlow(false);
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Create an account</CardTitle>
        <CardDescription>Enter your details to sign up for the admin panel</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={loading}
            />
          </div>
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            {userExistsFlow && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                An account with this email already exists. If you haven&apos;t verified yet, we can send you a new verification code.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
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
                    onClick={handleDismissUserExistsFlow}
                  >
                    Try different email
                  </Button>
                </div>
                <Link
                  href="/login"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Already verified? Sign in
                </Link>
              </div>
            </div>
            )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
