import { unstable_cache, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Key-value business settings with code-level defaults so an empty table
 * still renders a working site. Admin edits revalidate the cache tag.
 */

export const SETTING_DEFAULTS = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ashtavinayak Auto Consultant",
  businessPhone: process.env.NEXT_PUBLIC_PHONE_NUMBER || "",
  businessWhatsApp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  businessEmail: process.env.NEXT_PUBLIC_EMAIL || "",
  businessAddress: "",
  businessCity: "",
  businessState: "",
  businessPincode: "",
  googleMapsUrl: process.env.GOOGLE_MAPS_URL || "",
  businessHours: "Mon – Sun: 10:00 AM – 8:00 PM",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
  heroHeading: "Find the Right Used Vehicle at the Right Price",
  heroSubtitle:
    "Quality pre-owned cars, bikes, buses and commercial vehicles from Ashtavinayak Auto Consultant.",
  aboutSection:
    "Ashtavinayak Auto Consultant helps you buy and sell quality pre-owned vehicles with transparent information and professional assistance at every step.",
  featuredVehicleCount: 8,
  showVehicleSourcePublicly: false,
  siteTitle: "Ashtavinayak Auto Consultant — Buy & Sell Used Vehicles",
  siteDescription:
    "Browse quality used cars, bikes, scooters, buses and commercial vehicles, or sell your own vehicle through Ashtavinayak Auto Consultant.",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = { [K in SettingKey]: (typeof SETTING_DEFAULTS)[K] extends number ? number : (typeof SETTING_DEFAULTS)[K] extends boolean ? boolean : string };

const loadSettings = unstable_cache(
  async (): Promise<Settings> => {
    const rows = await prisma.setting.findMany();
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const merged = { ...SETTING_DEFAULTS } as Record<string, unknown>;
    for (const key of Object.keys(SETTING_DEFAULTS)) {
      if (key in stored && stored[key] !== null && stored[key] !== "") {
        merged[key] = stored[key];
      }
    }
    return merged as Settings;
  },
  ["app-settings"],
  { tags: ["settings"] }
);

export async function getSettings(): Promise<Settings> {
  return loadSettings();
}

export async function saveSettings(values: Partial<Record<SettingKey, unknown>>): Promise<void> {
  const entries = Object.entries(values).filter(([key]) => key in SETTING_DEFAULTS);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value as never },
        update: { value: value as never },
      })
    )
  );
  updateTag("settings");
}
