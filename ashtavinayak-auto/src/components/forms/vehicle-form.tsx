"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { vehicleFormSchema, type VehicleFormInput, type VehicleFormValues } from "@/schemas/vehicle";
import { createVehicle, updateVehicle } from "@/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader, type PendingImage } from "@/components/admin/image-uploader";
import {
  VEHICLE_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  CONDITION_OPTIONS,
} from "@/lib/vehicle-options";

type Category = { id: string; name: string };
type Feature = { id: string; name: string };
type ExistingImage = { id: string; url: string };

export function VehicleForm({
  categories,
  features,
  defaultValues,
  vehicleId,
  existingImages = [],
}: {
  categories: Category[];
  features: Feature[];
  defaultValues?: Partial<VehicleFormInput>;
  vehicleId?: string;
  existingImages?: ExistingImage[];
}) {
  const router = useRouter();
  const isEdit = Boolean(vehicleId);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [submitting, setSubmitting] = useState<"draft" | "publish" | "save" | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VehicleFormValues, unknown, VehicleFormInput>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      featureIds: [],
      isPriceNegotiable: false,
      rcAvailable: false,
      insuranceAvailable: false,
      pucAvailable: false,
      serviceHistoryAvailable: false,
      hasLoan: false,
      isFeatured: false,
      ...defaultValues,
    },
  });

  const buildFormData = (values: VehicleFormInput, intent: string) => {
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "featureIds") return;
      if (value === undefined || value === null) return;
      fd.set(key, String(value));
    });
    values.featureIds.forEach((id) => fd.append("featureIds", id));
    images.forEach((img) => fd.append("images", img.file, img.file.name));
    fd.set("intent", intent);
    return fd;
  };

  const onSubmit = (intent: "draft" | "publish" | "save") => async (values: VehicleFormInput) => {
    setSubmitting(intent);
    try {
      const fd = buildFormData(values, intent);
      const result = isEdit ? await updateVehicle(vehicleId!, fd) : await createVehicle(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Vehicle updated." : intent === "publish" ? "Vehicle published." : "Vehicle saved as draft.");
      router.push("/admin/vehicles");
      router.refresh();
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Category" id="categoryId" error={errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Vehicle Type" id="vehicleType" error={errors.vehicleType?.message}>
            <Controller
              control={control}
              name="vehicleType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="vehicleType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Brand" id="brand" error={errors.brand?.message}>
            <Input {...register("brand")} />
          </Field>
          <Field label="Model" id="model" error={errors.model?.message}>
            <Input {...register("model")} />
          </Field>
          <Field label="Variant" id="variant">
            <Input {...register("variant")} />
          </Field>
          <Field label="Year" id="year" error={errors.year?.message}>
            <Input type="number" {...register("year")} />
          </Field>
          <Field label="Registration Year" id="registrationYear">
            <Input type="number" {...register("registrationYear")} />
          </Field>
          <Field label="Registration Number" id="registrationNumber">
            <Input {...register("registrationNumber")} placeholder="Internal only — never public" />
          </Field>
          <Field label="Colour" id="color">
            <Input {...register("color")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Public Listing Price (₹)" id="price" error={errors.price?.message}>
            <Input type="number" {...register("price")} />
          </Field>
          <Field label="Owner Expected Price (₹)" id="ownerExpectedPrice" hint="Internal only">
            <Input type="number" {...register("ownerExpectedPrice")} />
          </Field>
          <Field label="Admin Valuation (₹)" id="adminValuation" hint="Internal only">
            <Input type="number" {...register("adminValuation")} />
          </Field>
          <Field label="Negotiated Price (₹)" id="negotiatedPrice" hint="Internal only">
            <Input type="number" {...register("negotiatedPrice")} />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <CheckboxField control={control} name="isPriceNegotiable" id="isPriceNegotiable" />
            <Label htmlFor="isPriceNegotiable">Price negotiable</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <CheckboxField control={control} name="isFeatured" id="isFeatured" />
            <Label htmlFor="isFeatured">Featured on homepage</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="KM Driven" id="kilometres" error={errors.kilometres?.message}>
            <Input type="number" {...register("kilometres")} />
          </Field>
          <Field label="Fuel Type" id="fuelType" error={errors.fuelType?.message}>
            <Controller
              control={control}
              name="fuelType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Transmission" id="transmission">
            <Controller
              control={control}
              name="transmission"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="transmission">
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Engine" id="engine">
            <Input {...register("engine")} placeholder="e.g. 1197 cc" />
          </Field>
          <Field label="Mileage" id="mileage">
            <Input {...register("mileage")} placeholder="e.g. 18 km/l" />
          </Field>
          <Field label="Owners" id="owners">
            <Input type="number" {...register("owners")} />
          </Field>
          <Field label="Condition" id="condition">
            <Controller
              control={control}
              name="condition"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="City" id="city" error={errors.city?.message}>
            <Input {...register("city")} />
          </Field>
          <Field label="State" id="state">
            <Input {...register("state")} />
          </Field>
          <Field label="Location / Area" id="location">
            <Input {...register("location")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={5} {...register("description")} placeholder="Tell buyers about this vehicle..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="featureIds"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {features.map((f) => {
                  const selected = field.value ?? [];
                  const checked = selected.includes(f.id);
                  return (
                    <label key={f.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          field.onChange(v ? [...selected, f.id] : selected.filter((id) => id !== f.id));
                        }}
                      />
                      {f.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["rcAvailable", "RC Available"],
              ["insuranceAvailable", "Insurance Available"],
              ["pucAvailable", "PUC Available"],
              ["serviceHistoryAvailable", "Service History Available"],
              ["hasLoan", "Loan / Hypothecation"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <CheckboxField control={control} name={name} />
              {label}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {isEdit && existingImages.length > 0 && (
            <p className="mb-3 text-sm text-muted-foreground">
              {existingImages.length} existing photo(s). New photos below will be added to them; manage existing photos from the panel underneath this form.
            </p>
          )}
          <ImageUploader images={images} onChange={setImages} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {isEdit ? (
          <Button type="button" size="lg" disabled={submitting !== null} onClick={handleSubmit(onSubmit("save"))}>
            {submitting === "save" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={submitting !== null}
              onClick={handleSubmit(onSubmit("draft"))}
            >
              {submitting === "draft" && <Loader2 className="h-4 w-4 animate-spin" />}
              Save as Draft
            </Button>
            <Button type="button" size="lg" disabled={submitting !== null} onClick={handleSubmit(onSubmit("publish"))}>
              {submitting === "publish" && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

function CheckboxField({
  control,
  name,
  id,
}: {
  control: Control<VehicleFormValues, unknown, VehicleFormInput>;
  name: FieldPath<VehicleFormValues>;
  id?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Checkbox
          id={id}
          checked={Boolean(field.value)}
          onCheckedChange={(v) => field.onChange(Boolean(v))}
        />
      )}
    />
  );
}

function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactElement<{ id?: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, { id })}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
