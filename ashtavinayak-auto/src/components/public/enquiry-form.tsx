"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEnquiry } from "@/actions/enquiries";

export function EnquiryForm({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createEnquiry(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      toast.success("Your enquiry has been sent.");
    });
  };

  if (submitted) {
    return (
      <p className="rounded-md bg-secondary p-4 text-sm">
        Thank you — your enquiry has been received. Our team will contact you shortly.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {/* Honeypot — hidden from real users, bots often fill it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="space-y-1.5">
        <Label htmlFor="enquiry-name">Name</Label>
        <Input id="enquiry-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enquiry-phone">Mobile</Label>
        <Input id="enquiry-phone" name="phone" type="tel" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enquiry-email">Email (optional)</Label>
        <Input id="enquiry-email" name="email" type="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea id="enquiry-message" name="message" rows={3} placeholder="I'm interested in this vehicle..." />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enquire Now
      </Button>
    </form>
  );
}
