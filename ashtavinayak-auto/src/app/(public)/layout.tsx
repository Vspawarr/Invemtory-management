import { getSettings } from "@/lib/settings";
import { waGeneralChat } from "@/lib/whatsapp";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const waLink = waGeneralChat();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader businessName={settings.businessName} phone={settings.businessPhone} waGeneralLink={waLink} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} waGeneralLink={waLink} />
    </div>
  );
}
