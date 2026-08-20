"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Car, Phone, Menu, User, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vehicles", label: "Buy Vehicles" },
  { href: "/vehicles?type=CAR", label: "Cars" },
  { href: "/vehicles?type=BIKE", label: "Bikes" },
  { href: "/vehicles?type=BUS", label: "Buses" },
  { href: "/vehicles?type=COMMERCIAL", label: "Commercial" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  businessName,
  phone,
  waGeneralLink,
}: {
  businessName: string;
  phone: string;
  waGeneralLink: string;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <span className="truncate text-sm font-bold leading-tight sm:text-base">
            {businessName}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-foreground/80 hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex">
            <Link href="/sell-your-vehicle">Sell Your Vehicle</Link>
          </Button>
          {phone && (
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Call us">
              <a href={`tel:${phone}`}>
                <Phone className="h-5 w-5" />
              </a>
            </Button>
          )}
          <WhatsAppButton href={waGeneralLink} size="icon" className="hidden md:inline-flex">
            <span className="sr-only">WhatsApp</span>
          </WhatsAppButton>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <User className="h-4 w-4" /> My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/favourites">
                    <Heart className="h-4 w-4" /> Saved Vehicles
                  </Link>
                </DropdownMenuItem>
                {(session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "SALES") && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Portal</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-8 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/sell-your-vehicle" onClick={() => setOpen(false)}>
                    Sell Your Vehicle
                  </Link>
                </Button>
                <WhatsAppButton href={waGeneralLink}>Chat on WhatsApp</WhatsAppButton>
                {phone && (
                  <Button asChild variant="outline">
                    <a href={`tel:${phone}`}>
                      <Phone className="h-4 w-4" /> Call Us
                    </a>
                  </Button>
                )}
                {!session?.user && (
                  <Button asChild variant="outline">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      Login / Admin Login
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
