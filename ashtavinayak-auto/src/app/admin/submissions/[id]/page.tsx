import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { findPossibleDuplicates } from "@/actions/submissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppImage } from "@/components/app-image";
import { SubmissionReviewActions } from "@/components/admin/submission-review-actions";
import { SubmissionApproveForm } from "@/components/admin/submission-approve-form";
import { WhatsAppContactPanel } from "@/components/admin/whatsapp-contact-panel";
import { formatPrice, formatNumber } from "@/lib/utils";
import {
  SUBMISSION_STATUS_LABELS,
  VEHICLE_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  CONDITION_OPTIONS,
} from "@/lib/vehicle-options";

export const metadata = { title: "Review Submission" };

export default async function SubmissionReviewPage({ params }: PageProps<"/admin/submissions/[id]">) {
  const { id } = await params;

  const submission = await prisma.vehicleSubmission.findUnique({
    where: { id },
    include: { seller: true, images: { orderBy: { sortOrder: "asc" } }, vehicle: true },
  });
  if (!submission) notFound();

  const [categories, features, duplicates] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.feature.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    findPossibleDuplicates(id),
  ]);

  const label = (opts: readonly { value: string; label: string }[], v?: string | null) =>
    opts.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-mono">{submission.referenceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {format(submission.createdAt, "dd MMM yyyy, HH:mm")}
          </p>
        </div>
        <Badge className="text-sm">{SUBMISSION_STATUS_LABELS[submission.status]}</Badge>
      </div>

      {duplicates.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Possible Duplicate</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc pl-4">
              {duplicates.map((d) => (
                <li key={`${d.type}-${d.id}`}>
                  {d.reason}: {d.type === "submission" ? (
                    <Link href={`/admin/submissions/${d.id}`} className="underline">{d.reference}</Link>
                  ) : (
                    <Link href={`/admin/vehicles/${d.id}/edit`} className="underline">{d.reference}</Link>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {submission.vehicle && (
        <Alert variant="success">
          <AlertTitle>Already Listed</AlertTitle>
          <AlertDescription>
            This submission was approved and is live at{" "}
            <Link href={`/vehicles/${submission.vehicle.slug}`} className="underline" target="_blank">
              /vehicles/{submission.vehicle.slug}
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Name" value={submission.seller.name} />
              <Info label="Phone" value={submission.seller.phone} />
              <Info label="Email" value={submission.seller.email ?? "—"} />
              <Info label="City" value={submission.seller.city} />
              <Info label="Preferred Contact" value={submission.seller.preferredContact} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Vehicle</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Type" value={label(VEHICLE_TYPE_OPTIONS, submission.vehicleType)} />
              <Info label="Brand" value={submission.brand} />
              <Info label="Model" value={submission.model} />
              <Info label="Variant" value={submission.variant ?? "—"} />
              <Info label="Year" value={String(submission.year)} />
              <Info label="Registration Year" value={submission.registrationYear ? String(submission.registrationYear) : "—"} />
              <Info label="Registration Number" value={submission.registrationNumber ?? "—"} />
              <Info label="KM" value={formatNumber(submission.kilometres)} />
              <Info label="Fuel" value={label(FUEL_TYPE_OPTIONS, submission.fuelType)} />
              <Info label="Transmission" value={label(TRANSMISSION_OPTIONS, submission.transmission) ?? "—"} />
              <Info label="Engine" value={submission.engine ?? "—"} />
              <Info label="Colour" value={submission.color ?? "—"} />
              <Info label="Owners" value={submission.owners ? String(submission.owners) : "—"} />
              <Info label="Condition" value={label(CONDITION_OPTIONS, submission.condition) ?? "—"} />
              <Info label="Expected Price" value={formatPrice(submission.expectedPrice)} />
              <Info label="Negotiable" value={submission.isPriceNegotiable ? "Yes" : "No"} />
              <Info label="City" value={submission.city} />
              <Info label="State" value={submission.state ?? "—"} />
              <Info label="PIN" value={submission.pincode ?? "—"} />
              <Info label="Vehicle Location" value={submission.vehicleLocation ?? "—"} />
            </CardContent>
            {submission.description && (
              <CardContent className="pt-0 text-sm text-muted-foreground">{submission.description}</CardContent>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Document Status</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="RC" value={submission.rcAvailable ? "Available" : "Not available"} />
              <Info label="Insurance" value={submission.insuranceAvailable ? "Available" : "Not available"} />
              <Info label="PUC" value={submission.pucAvailable ? "Available" : "Not available"} />
              <Info label="Service History" value={submission.serviceHistoryAvailable ? "Available" : "Not available"} />
              <Info label="Loan / Hypothecation" value={submission.hasLoan ? "Yes" : "No"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {submission.images.map((img) => (
                <div key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                  <AppImage src={img.url} alt="" fill sizes="200px" className="object-cover" />
                </div>
              ))}
            </CardContent>
          </Card>

          {!submission.vehicle && (submission.status === "PENDING_REVIEW" || submission.status === "UNDER_REVIEW" || submission.status === "MORE_INFORMATION_REQUIRED") && (
            <Card>
              <CardHeader><CardTitle>Approve &amp; List</CardTitle></CardHeader>
              <CardContent>
                <SubmissionApproveForm
                  submissionId={submission.id}
                  categories={categories}
                  features={features}
                  defaultDescription={submission.description ?? ""}
                  defaultCity={submission.city}
                  defaultState={submission.state ?? ""}
                  defaultExpectedPrice={submission.expectedPrice}
                />
              </CardContent>
            </Card>
          )}

          {submission.requestMoreInfoMessage && submission.status === "MORE_INFORMATION_REQUIRED" && (
            <Alert variant="warning">
              <AlertTitle>Information requested from seller</AlertTitle>
              <AlertDescription>{submission.requestMoreInfoMessage}</AlertDescription>
            </Alert>
          )}
          {submission.rejectionReason && submission.status === "REJECTED" && (
            <Alert variant="destructive">
              <AlertTitle>Internal rejection reason (not shown publicly)</AlertTitle>
              <AlertDescription>{submission.rejectionReason}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="pt-6">
              <SubmissionReviewActions id={submission.id} status={submission.status} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <WhatsAppContactPanel
                title="WhatsApp Seller"
                phone={submission.seller.phone}
                defaultMessage={`Hello ${submission.seller.name},\n\nThis is Ashtavinayak Auto Consultant regarding your vehicle submission.\n\nReference: ${submission.referenceNumber}\nVehicle: ${submission.year} ${submission.brand} ${submission.model}\n\nWe would like to discuss your vehicle submission.\n\nThank you.`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}
