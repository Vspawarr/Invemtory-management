"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCallbackRequest } from "@/actions/enquiries";

export function CallbackForm({ vehicleId }: { vehicleId?: string }) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createCallbackRequest(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      toast.success("Callback requested.");
    });
  };

  if (submitted) {
    return (
      <p className="rounded-md bg-secondary p-4 text-sm">
        Thanks — we&apos;ll call you back soon.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3">
      {vehicleId && <input type="hidden" name="vehicleId" value={vehicleId} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="space-y-1.5">
        <Label htmlFor="callback-name">Name</Label>
        <Input id="callback-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="callback-phone">Mobile</Label>
        <Input id="callback-phone" name="phone" type="tel" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="callback-time">Preferred time</Label>
        <Input id="callback-time" name="preferredTime" placeholder="e.g. Evening after 6 PM" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="callback-message">Message</Label>
        <Textarea id="callback-message" name="message" rows={2} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Request Callback
      </Button>
    </form>
  );
}
