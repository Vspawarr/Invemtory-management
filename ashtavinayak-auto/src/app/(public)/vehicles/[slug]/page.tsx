import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PUBLIC_VEHICLE_SELECT, PUBLIC_VEHICLE_STATUSES, vehicleTitle } from "@/lib/public-vehicle";
import { getSettings } from "@/lib/settings";
import { waVehicleEnquiry, waVehicleInterest } from "@/lib/whatsapp";
import { formatPrice, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleGallery } from "@/components/public/vehicle-gallery";
import { VehicleSpecs } from "@/components/public/vehicle-specs";
import { VerificationBadges } from "@/components/public/verification-badges";
import { VehicleStatusBadge } from "@/components/public/status-badge";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { CallbackForm } from "@/components/public/callback-form";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { MobileStickyCta } from "@/components/public/mobile-sticky-cta";
import { Phone } from "lucide-react";

async function getVehicle(slug: string) {
  return prisma.vehicle.findFirst({
    where: { slug, status: { in: [...PUBLIC_VEHICLE_STATUSES] } },
    select: PUBLIC_VEHICLE_SELECT,
  });
}

export async function generateMetadata({ params }: PageProps<"/vehicles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicle(slug);
  if (!vehicle) return { title: "Vehicle Not Found" };

  const title = vehicleTitle(vehicle);
  const description = `${title} — ${formatNumber(vehicle.kilometres)} km, ${vehicle.fuelType.toLowerCase()}, ${formatPrice(vehicle.price)}. Located in ${vehicle.city}.`;
  const image = vehicle.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: { title, description, images: image ? [image] : undefined, type: "website" },
  };
}

export default async function VehicleDetailPage({ params }: PageProps<"/vehicles/[slug]">) {
  const { slug } = await params;
  const [vehicle, settings] = await Promise.all([getVehicle(slug), getSettings()]);
  if (!vehicle) notFound();

  const title = vehicleTitle(vehicle);
  const waDetailLink = waVehicleEnquiry({ title, price: formatPrice(vehicle.price), reference: vehicle.slug });
  const waInterestLink = waVehicleInterest(title);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    brand: vehicle.brand,
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.kilometres, unitCode: "KMT" },
    fuelType: vehicle.fuelType,
    vehicleTransmission: vehicle.transmission ?? undefined,
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "INR",
      availability: vehicle.status === "LISTED" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
    },
    image: vehicle.images.map((i) => i.url),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <VehicleGallery images={vehicle.images} title={title} />

          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</p>
              </div>
              <VehicleStatusBadge status={vehicle.status} />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-primary">
              {formatPrice(vehicle.price)}
              {vehicle.isPriceNegotiable && <span className="ml-2 text-sm font-normal text-muted-foreground">Negotiable</span>}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold">Specifications</h2>
              <VehicleSpecs vehicle={vehicle} />
            </CardContent>
          </Card>

          {vehicle.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-2 font-semibold">Description</h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{vehicle.description}</p>
              </CardContent>
            </Card>
          )}

          {vehicle.features.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-3 font-semibold">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <Badge key={f.feature.id} variant="secondary">
                      {f.feature.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-3 font-semibold">Verification</h2>
              <VerificationBadges
                rcAvailable={vehicle.rcAvailable}
                insuranceAvailable={vehicle.insuranceAvailable}
                pucAvailable={vehicle.pucAvailable}
                serviceHistoryAvailable={vehicle.serviceHistoryAvailable}
                hasLoan={vehicle.hasLoan}
              />
            </CardContent>
          </Card>
        </div>

        <div id="enquire" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="grid grid-cols-2 gap-2">
                {settings.businessPhone && (
                  <a
                    href={`tel:${settings.businessPhone}`}
                    className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
                <WhatsAppButton href={waDetailLink}>WhatsApp</WhatsAppButton>
              </div>
              <WhatsAppButton href={waInterestLink} className="w-full">
                Enquire on WhatsApp
              </WhatsAppButton>
              <div className="h-px bg-border" />
              <h2 className="font-semibold">Enquire Now</h2>
              <EnquiryForm vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-1 font-semibold">Request a Callback</h2>
              <p className="mb-3 text-xs text-muted-foreground">Prefer a call? Leave your details.</p>
              <CallbackForm vehicleId={vehicle.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileStickyCta phone={settings.businessPhone} whatsappLink={waDetailLink} />
    </div>
  );
}
