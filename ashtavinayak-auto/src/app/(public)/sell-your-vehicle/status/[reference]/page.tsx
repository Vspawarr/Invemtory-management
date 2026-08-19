import type { Metadata } from "next";
import { format } from "date-fns";
import { getPublicSubmissionStatus } from "@/actions/submissions";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusTimeline } from "@/components/public/submission-status-timeline";
import { SUBMISSION_STATUS_LABELS } from "@/lib/vehicle-options";

export const metadata: Metadata = { title: "Submission Status", robots: { index: false, follow: false } };

export default async function SubmissionStatusPage({
  params,
  searchParams,
}: PageProps<"/sell-your-vehicle/status/[reference]">) {
  const { reference } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  const status = await getPublicSubmissionStatus(decodeURIComponent(reference), token);

  if (!status) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Submission Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find a submission matching this link. Please check the status link you received, or
          contact us if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardContent className="space-y-6 pt-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference Number</p>
            <p className="text-xl font-bold">{status.referenceNumber}</p>
            <p className="mt-1 text-sm text-muted-foreground">{status.vehicleTitle}</p>
            <p className="text-xs text-muted-foreground">Submitted {format(status.createdAt, "dd MMM yyyy")}</p>
          </div>

          <SubmissionStatusTimeline status={status.status} />

          <div className="rounded-md bg-secondary p-3 text-center text-sm font-medium">
            Current Status: {SUBMISSION_STATUS_LABELS[status.status] ?? status.status}
          </div>

          {status.requestMoreInfoMessage && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-1 font-semibold">Additional information required</p>
              <p>{status.requestMoreInfoMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
