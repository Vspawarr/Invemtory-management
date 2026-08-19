import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { waSellIntent } from "@/lib/whatsapp";

export function SellCtaSection() {
  return (
    <section className="bg-primary py-14 text-primary-foreground">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold">Want to Sell Your Vehicle?</h2>
        <p className="mt-3 text-primary-foreground/80">
          Submit your vehicle details and photographs. Our team will review your submission and get back to you.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/20 bg-white/5 p-5 text-left">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-accent">Option A</p>
            <p className="mb-4 font-medium">Submit Vehicle Online</p>
            <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/sell-your-vehicle">
                Sell Your Vehicle <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/5 p-5 text-left">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-accent">Option B</p>
            <p className="mb-4 font-medium">Chat on WhatsApp</p>
            <WhatsAppButton href={waSellIntent()} size="lg" className="w-full">
              Chat on WhatsApp
            </WhatsAppButton>
          </div>
        </div>
      </div>
    </section>
  );
}
