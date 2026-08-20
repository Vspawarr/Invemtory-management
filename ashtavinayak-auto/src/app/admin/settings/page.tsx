import { requireSuperAdmin } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireSuperAdmin();
  const settings = await getSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Business information, homepage content and SEO — used across the public site.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
