import type { Metadata } from "next";

import { FarmerRegistrationWizard } from "@/components/farmers/farmer-registration-wizard";

export const metadata: Metadata = { title: "Add Farmer — Champavati Agro" };

export default function NewFarmerPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Add farmer</h1>
        <p className="text-sm text-muted-foreground">
          Register a new farmer, their address, and their land parcels.
        </p>
      </div>
      <FarmerRegistrationWizard />
    </div>
  );
}
