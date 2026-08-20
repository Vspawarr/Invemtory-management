import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "About Us" };

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">About {settings.businessName}</h1>
      <p className="mt-4 text-muted-foreground">{settings.aboutSection}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-2 font-semibold">Who We Are</h2>
            <p className="text-sm text-muted-foreground">
              {settings.businessName} helps people buy and sell pre-owned vehicles — cars, bikes, scooters,
              buses and commercial vehicles — through a straightforward, transparent process.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-2 font-semibold">What We Do</h2>
            <p className="text-sm text-muted-foreground">
              We list vehicles from our own stock and from vehicle owners who submit their vehicle for
              review. Every listing is checked by our team before it appears publicly.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-2 font-semibold">Our Approach</h2>
            <p className="text-sm text-muted-foreground">
              Clear specifications, honest condition reporting and fair pricing — so buyers and sellers can
              make informed decisions.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-2 font-semibold">Customer Trust</h2>
            <p className="text-sm text-muted-foreground">
              Every vehicle submission goes through admin review before it is listed, and all buyer and
              seller communication is routed through our team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
