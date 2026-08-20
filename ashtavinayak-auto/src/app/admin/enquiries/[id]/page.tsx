import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnquiryStatusSelect, EnquiryNotesForm } from "@/components/admin/enquiry-actions";
import { WhatsAppContactPanel } from "@/components/admin/whatsapp-contact-panel";

export const metadata = { title: "Enquiry Detail" };

export default async function AdminEnquiryDetailPage({ params }: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await params;

  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { vehicle: { select: { slug: true, brand: true, model: true, year: true } } },
  });
  if (!enquiry) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{enquiry.name}</h1>
          <p className="text-sm text-muted-foreground">
            Enquired {format(enquiry.createdAt, "dd MMM yyyy, HH:mm")}
          </p>
        </div>
        <EnquiryStatusSelect id={enquiry.id} status={enquiry.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Enquiry</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Name" value={enquiry.name} />
              <Info label="Phone" value={enquiry.phone} />
              <Info label="Email" value={enquiry.email ?? "—"} />
              <Info
                label="Vehicle"
                value={
                  enquiry.vehicle ? (
                    <Link href={`/vehicles/${enquiry.vehicle.slug}`} target="_blank" className="underline">
                      {enquiry.vehicle.year} {enquiry.vehicle.brand} {enquiry.vehicle.model}
                    </Link>
                  ) : (
                    "General enquiry"
                  )
                }
              />
            </CardContent>
            {enquiry.message && (
              <CardContent className="pt-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
                <p className="text-sm">{enquiry.message}</p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardContent className="pt-6">
              <EnquiryNotesForm id={enquiry.id} initialNotes={enquiry.internalNotes ?? ""} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="pt-6">
              <WhatsAppContactPanel
                title="WhatsApp Buyer"
                phone={enquiry.phone}
                defaultMessage={`Hello ${enquiry.name},\n\nThis is Ashtavinayak Auto Consultant regarding your enquiry${
                  enquiry.vehicle ? ` for:\n\n${enquiry.vehicle.year} ${enquiry.vehicle.brand} ${enquiry.vehicle.model}` : ""
                }\n\nWe received your enquiry and would like to assist you.\n\nThank you.`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
