"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const [email, setEmail] = useState(emailParam ?? "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !otp) {
      toast.error("Please enter your email and verification code");
      return;
    }
    setLoading(true);
    const { data, error } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });
    setLoading(false);
    if (error) {
      toast.error("Invalid or expired code. Please try again.");
      return;
    }
    if (data) {
      toast.success("Email verified successfully");
      router.push("/");
      router.refresh();
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (resendCooldown > 0) return;
    setLoading(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send verification code. Please try again.");
      return;
    }
    toast.success("Verification code sent. Check your email.");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold">Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email address
          </CardDescription>
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
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || resendCooldown > 0}
              onClick={handleResend}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend verification code"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
