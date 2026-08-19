"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { approveAndListSubmission } from "@/actions/submissions";

type Category = { id: string; name: string };
type Feature = { id: string; name: string };

export function SubmissionApproveForm({
  submissionId,
  categories,
  features,
  defaultDescription,
  defaultCity,
  defaultState,
  defaultExpectedPrice,
}: {
  submissionId: string;
  categories: Category[];
  features: Feature[];
  defaultDescription: string;
  defaultCity: string;
  defaultState: string;
  defaultExpectedPrice?: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [listingPrice, setListingPrice] = useState(defaultExpectedPrice ? String(defaultExpectedPrice) : "");
  const [adminValuation, setAdminValuation] = useState("");
  const [negotiatedPrice, setNegotiatedPrice] = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [description, setDescription] = useState(defaultDescription);
  const [city, setCity] = useState(defaultCity);
  const [stateVal, setStateVal] = useState(defaultState);
  const [location, setLocation] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [featureIds, setFeatureIds] = useState<string[]>([]);

  const submit = () => {
    if (!categoryId) {
      toast.error("Select a category.");
      return;
    }
    if (!listingPrice || Number(listingPrice) < 0) {
      toast.error("Enter a valid public listing price.");
      return;
    }
    startTransition(async () => {
      const result = await approveAndListSubmission(submissionId, {
        categoryId,
        listingPrice: Number(listingPrice),
        adminValuation: adminValuation ? Number(adminValuation) : undefined,
        negotiatedPrice: negotiatedPrice ? Number(negotiatedPrice) : undefined,
        isPriceNegotiable,
        description,
        city,
        state: stateVal,
        location,
        featureIds,
        isFeatured,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Vehicle approved and listed.");
      router.push(`/admin/vehicles/${result.data.vehicleId}/edit`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="approve-category">Category *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="approve-category"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-listing-price">Public Listing Price (₹) *</Label>
          <Input id="approve-listing-price" type="number" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-valuation">Admin Valuation (₹)</Label>
          <Input id="approve-valuation" type="number" value={adminValuation} onChange={(e) => setAdminValuation(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-negotiated">Negotiated Price (₹)</Label>
          <Input id="approve-negotiated" type="number" value={negotiatedPrice} onChange={(e) => setNegotiatedPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-city">City *</Label>
          <Input id="approve-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-state">State</Label>
          <Input id="approve-state" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-location">Location / Area</Label>
          <Input id="approve-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isPriceNegotiable} onCheckedChange={(v) => setIsPriceNegotiable(Boolean(v))} />
          Price negotiable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isFeatured} onCheckedChange={(v) => setIsFeatured(Boolean(v))} />
          Feature on homepage
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="approve-description">Public Description</Label>
        <Textarea id="approve-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {features.length > 0 && (
        <div className="space-y-1.5">
          <Label id="approve-features-label">Features</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {features.map((f) => {
              const checked = featureIds.includes(f.id);
              return (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      setFeatureIds((prev) => (v ? [...prev, f.id] : prev.filter((id) => id !== f.id)))
                    }
                  />
                  {f.name}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <Button onClick={submit} size="lg" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Approve &amp; List
      </Button>
    </div>
  );
}
