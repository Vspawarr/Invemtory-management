import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { LoginHero } from "@/components/auth/login-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in — Champavati Agro Intelligence",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <LoginHero />
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <p className="font-display text-lg font-semibold text-primary">Champavati Agro</p>
            <p className="text-sm text-muted-foreground">Better records. Better crop decisions.</p>
          </div>
          <Card className="border-none shadow-lg lg:border lg:shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Use the email or mobile number registered with your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
