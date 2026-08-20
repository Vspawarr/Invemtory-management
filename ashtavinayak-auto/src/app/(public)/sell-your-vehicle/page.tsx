import type { Metadata } from "next";
import { SellVehicleForm } from "@/components/forms/sell-vehicle-form";

export const metadata: Metadata = {
  title: "Sell Your Vehicle",
  description: "Submit your vehicle details and photographs. Our team will review your vehicle and contact you.",
};

export default function SellYourVehiclePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Want to Sell Your Vehicle?</h1>
        <p className="mt-2 text-muted-foreground">
          Submit your vehicle details and photographs. Our team will review your vehicle and contact you.
        </p>
      </div>
      <SellVehicleForm />
    </div>
  );
}
