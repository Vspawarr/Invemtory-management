import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { getSettings } from "@/lib/settings";
import { waGeneralChat } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Account" };

const TABS = [
  { href: "/account", label: "Profile" },
  { href: "/account/favourites", label: "Saved Vehicles" },
  { href: "/account/enquiries", label: "My Enquiries" },
];

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  await requireUser();
  const settings = await getSettings();
  const waLink = waGeneralChat();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader businessName={settings.businessName} phone={settings.businessPhone} waGeneralLink={waLink} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Account</h1>
        <nav className="mb-6 flex gap-1 border-b">
          {TABS.map((tab) => (
            <AccountTab key={tab.href} href={tab.href} label={tab.label} />
          ))}
        </nav>
        {children}
      </main>
      <SiteFooter settings={settings} waGeneralLink={waLink} />
    </div>
  );
}

function AccountTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
