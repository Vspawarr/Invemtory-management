"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { waSubmissionConfirmation, waStatusShare } from "@/lib/whatsapp";
import { submissionStatusPath } from "@/lib/reference-number";

export function SubmissionSuccessView({
  referenceNumber,
  trackingToken,
}: {
  referenceNumber: string;
  trackingToken: string;
}) {
  const statusPath = submissionStatusPath(referenceNumber, trackingToken);
  const statusUrl = typeof window !== "undefined" ? `${window.location.origin}${statusPath}` : statusPath;

  return (
    <Card className="mx-auto max-w-lg text-center">
      <CardContent className="space-y-5 pt-8 pb-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">Vehicle Submitted Successfully</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for submitting your vehicle. Our team will review the details and contact you shortly.
          </p>
        </div>
        <div className="rounded-md bg-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference Number</p>
          <p className="text-xl font-bold">{referenceNumber}</p>
        </div>
        <div className="space-y-2">
          <WhatsAppButton href={waSubmissionConfirmation(referenceNumber)} className="w-full">
            Contact Us on WhatsApp
          </WhatsAppButton>
          <Button asChild variant="outline" className="w-full">
            <Link href={statusPath}>Check Submission Status</Link>
          </Button>
          <WhatsAppButton href={waStatusShare(referenceNumber, statusUrl)} className="w-full" size="sm">
            Share Status on WhatsApp
          </WhatsAppButton>
        </div>
        <p className="text-xs text-muted-foreground">
          Save this reference number and status link — you&apos;ll need them to check your submission status.
        </p>
        <Button asChild variant="ghost">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
