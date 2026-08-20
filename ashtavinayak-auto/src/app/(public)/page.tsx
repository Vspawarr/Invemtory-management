import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, BadgeIndianRupee, Car, Headset, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PUBLIC_VEHICLE_SELECT, PUBLIC_VEHICLE_STATUSES } from "@/lib/public-vehicle";
import { waGeneralChat } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSearch } from "@/components/public/hero-search";
import { CategoryCard } from "@/components/public/category-card";
import { VehicleCard } from "@/components/public/vehicle-card";
import { SellCtaSection } from "@/components/public/sell-cta-section";
import { WhatsAppButton } from "@/components/public/whatsapp-button";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { absolute: settings.siteTitle },
    description: settings.siteDescription,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const settings = await getSettings();
  const publicStatus = { in: Array.from(PUBLIC_VEHICLE_STATUSES) };

  const [categories, featured, latest] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { vehicles: { where: { status: publicStatus } } } } },
    }),
    prisma.vehicle.findMany({
      where: { isFeatured: true, status: publicStatus },
      select: PUBLIC_VEHICLE_SELECT,
      orderBy: { createdAt: "desc" },
      take: settings.featuredVehicleCount,
    }),
    prisma.vehicle.findMany({
      where: { status: publicStatus },
      select: PUBLIC_VEHICLE_SELECT,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-secondary/60 to-background py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{settings.heroHeading}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{settings.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/vehicles">
                Browse Vehicles <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <Link href="/sell-your-vehicle">Sell Your Vehicle</Link>
            </Button>
            <WhatsAppButton href={waGeneralChat()} size="lg">
              WhatsApp Us
            </WhatsAppButton>
          </div>
          <div className="mt-10">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-6 text-2xl font-bold">Browse by Vehicle Type</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} name={cat.name} slug={cat.slug} count={cat._count.vehicles} imageUrl={cat.imageUrl} />
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-secondary/30 py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Featured Vehicles</h2>
              <Link href="/vehicles" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-bold">Why Choose Us</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Car, title: "Quality Vehicles", desc: "Every listing is reviewed by our team before it goes live." },
            { icon: ShieldCheck, title: "Transparent Information", desc: "Clear specifications, condition and pricing — no surprises." },
            { icon: BadgeIndianRupee, title: "Competitive Pricing", desc: "Fair market pricing on every vehicle we list." },
            { icon: Headset, title: "Professional Assistance", desc: "Our team is available to guide you through buying or selling." },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-6 text-center">
                <item.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/30 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-center font-semibold text-primary">For Buyers</h3>
              <ol className="space-y-3">
                {["Browse Vehicles", "Select Vehicle", "Contact Us", "Inspect & Discuss", "Complete Purchase"].map(
                  (step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  )
                )}
              </ol>
            </div>
            <div>
              <h3 className="mb-4 text-center font-semibold text-accent">For Sellers</h3>
              <ol className="space-y-3">
                {["Submit Vehicle", "Upload Photos", "Admin Reviews", "Vehicle Gets Listed", "Buyer Enquiries"].map(
                  (step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  )
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <SellCtaSection />

      {/* Latest */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest Vehicles</h2>
            <Link href="/vehicles?sort=newest" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="border-t bg-secondary/30 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold">Have Questions?</h2>
          <p className="mt-2 text-muted-foreground">Our team is here to help you buy or sell with confidence.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <WhatsAppButton href={waGeneralChat()} size="lg">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </WhatsAppButton>
          </div>
        </div>
      </section>
    </>
  );
}
