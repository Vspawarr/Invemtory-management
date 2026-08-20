import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { waGeneralChat } from "@/lib/whatsapp";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { Phone, Mail, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getSettings();

  // Google share links (maps.app.goo.gl/...) can't be embedded in an iframe —
  // Google blocks that. The embeddable preview is generated from the address;
  // the saved googleMapsUrl is used as a plain "Get Directions" link instead.
  const addressQuery = [settings.businessAddress, settings.businessCity, settings.businessState]
    .filter(Boolean)
    .join(", ");
  const embedSrc = addressQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&output=embed`
    : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">We&apos;d love to hear from you.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <h2 className="font-semibold">{settings.businessName}</h2>
              {settings.businessPhone && (
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${settings.businessPhone}`}>{settings.businessPhone}</a>
                </p>
              )}
              {settings.businessEmail && (
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${settings.businessEmail}`}>{settings.businessEmail}</a>
                </p>
              )}
              {settings.businessAddress && (
                <p className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  {settings.businessAddress}
                  {settings.businessCity ? `, ${settings.businessCity}` : ""}
                  {settings.businessState ? `, ${settings.businessState}` : ""}
                  {settings.businessPincode ? ` - ${settings.businessPincode}` : ""}
                </p>
              )}
              {settings.businessHours && (
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {settings.businessHours}
                </p>
              )}
              <WhatsAppButton href={waGeneralChat()} className="w-full">
                Chat on WhatsApp
              </WhatsAppButton>
            </CardContent>
          </Card>

          {embedSrc && (
            <Card className="overflow-hidden">
              <iframe src={embedSrc} className="h-64 w-full border-0" loading="lazy" title="Location map" />
            </Card>
          )}
          {settings.googleMapsUrl && (
            <Button asChild variant="outline" className="w-full">
              <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Get Directions on Google Maps
              </a>
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 font-semibold">Send us a message</h2>
            <EnquiryForm vehicleId="" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
