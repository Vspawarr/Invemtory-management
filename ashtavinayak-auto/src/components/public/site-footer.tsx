import Link from "next/link";
import { Car, Phone, Mail, MapPin } from "lucide-react";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import type { Settings } from "@/lib/settings";

export function SiteFooter({ settings, waGeneralLink }: { settings: Settings; waGeneralLink: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Car className="h-4 w-4" />
            </div>
            <span className="font-bold">{settings.businessName}</span>
          </div>
          <p className="text-sm text-muted-foreground">{settings.siteDescription}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/vehicles" className="hover:text-foreground">Buy Vehicles</Link></li>
            <li><Link href="/sell-your-vehicle" className="hover:text-foreground">Sell Your Vehicle</Link></li>
            <li><Link href="/vehicles?type=CAR" className="hover:text-foreground">Cars</Link></li>
            <li><Link href="/vehicles?type=BIKE" className="hover:text-foreground">Bikes</Link></li>
            <li><Link href="/vehicles?type=BUS" className="hover:text-foreground">Buses</Link></li>
            <li><Link href="/vehicles?type=COMMERCIAL" className="hover:text-foreground">Commercial Vehicles</Link></li>
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {settings.businessPhone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> <a href={`tel:${settings.businessPhone}`}>{settings.businessPhone}</a>
              </li>
            )}
            {settings.businessEmail && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> <a href={`mailto:${settings.businessEmail}`}>{settings.businessEmail}</a>
              </li>
            )}
            {settings.businessCity && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {settings.businessCity}{settings.businessState ? `, ${settings.businessState}` : ""}
              </li>
            )}
          </ul>
          <div className="mt-3">
            <WhatsAppButton href={waGeneralLink} size="sm">Chat on WhatsApp</WhatsAppButton>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Admin</h4>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Admin Login
          </Link>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {year} {settings.businessName}. All rights reserved.
      </div>
    </footer>
  );
}
