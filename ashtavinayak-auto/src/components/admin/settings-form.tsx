"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettings } from "@/actions/settings";
import type { Settings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [showSource, setShowSource] = useState(settings.showVehicleSourcePublicly);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateSettings(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Settings saved.");
    });
  };

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField name="businessName" label="Business Name" defaultValue={settings.businessName} />
          <TextField name="businessPhone" label="Phone" defaultValue={settings.businessPhone} />
          <TextField
            name="businessWhatsApp"
            label="WhatsApp Number"
            defaultValue={settings.businessWhatsApp}
            hint="International format, digits only, e.g. 91XXXXXXXXXX"
          />
          <TextField name="businessEmail" label="Email" defaultValue={settings.businessEmail} />
          <TextField name="businessAddress" label="Address" defaultValue={settings.businessAddress} />
          <TextField name="businessCity" label="City" defaultValue={settings.businessCity} />
          <TextField name="businessState" label="State" defaultValue={settings.businessState} />
          <TextField name="businessPincode" label="PIN Code" defaultValue={settings.businessPincode} />
          <TextField
            name="googleMapsUrl"
            label="Google Maps Link"
            defaultValue={settings.googleMapsUrl}
            hint="A share link (e.g. maps.app.goo.gl/...) is fine — shown as a 'Get Directions' button. The embedded map preview is generated from the address above."
          />
          <TextField name="businessHours" label="Business Hours" defaultValue={settings.businessHours} />
          <TextField name="socialFacebook" label="Facebook URL" defaultValue={settings.socialFacebook} />
          <TextField name="socialInstagram" label="Instagram URL" defaultValue={settings.socialInstagram} />
          <TextField name="socialYoutube" label="YouTube URL" defaultValue={settings.socialYoutube} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage Content</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField name="heroHeading" label="Hero Heading" defaultValue={settings.heroHeading} />
          <TextAreaField name="heroSubtitle" label="Hero Subtitle" defaultValue={settings.heroSubtitle} />
          <TextAreaField name="aboutSection" label="About Section" defaultValue={settings.aboutSection} />
          <TextField
            name="featuredVehicleCount"
            label="Featured Vehicle Count"
            type="number"
            defaultValue={String(settings.featuredVehicleCount)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Vehicle Disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="showVehicleSourcePublicly"
              checked={showSource}
              onCheckedChange={(v) => setShowSource(Boolean(v))}
            />
            <Label htmlFor="showVehicleSourcePublicly">
              Show &quot;Listed through Ashtavinayak Auto Consultant&quot; on customer-submitted vehicles
            </Label>
          </div>
          {showSource && <input type="hidden" name="showVehicleSourcePublicly" value="true" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField name="siteTitle" label="Site Title" defaultValue={settings.siteTitle} />
          <TextAreaField name="siteDescription" label="Meta Description" defaultValue={settings.siteDescription} />
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </form>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  hint,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextAreaField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={3} />
    </div>
  );
}
