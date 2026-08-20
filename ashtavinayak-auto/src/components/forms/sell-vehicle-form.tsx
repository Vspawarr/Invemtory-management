"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  submissionSchema,
  ownerDetailsSchema,
  submissionVehicleDetailsSchema,
  submissionPriceLocationSchema,
  type SubmissionInput,
  type SubmissionValues,
} from "@/schemas/submission";
import { createSubmission } from "@/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader, type PendingImage } from "@/components/admin/image-uploader";
import {
  VEHICLE_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  CONDITION_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
} from "@/lib/vehicle-options";
import { SubmissionSuccessView } from "@/components/public/submission-success-view";

const DRAFT_KEY = "aac-sell-vehicle-draft";

const STEPS = [
  { title: "Owner Details", fields: ["name", "phone", "email", "city", "state", "preferredContact"] },
  {
    title: "Vehicle Details",
    fields: [
      "vehicleType",
      "brand",
      "model",
      "variant",
      "year",
      "registrationYear",
      "registrationNumber",
      "kilometres",
      "fuelType",
      "transmission",
      "engine",
      "color",
      "owners",
      "condition",
    ],
  },
  {
    title: "Price & Location",
    fields: [
      "expectedPrice",
      "isPriceNegotiable",
      "pincode",
      "vehicleLocation",
      "description",
      "rcAvailable",
      "insuranceAvailable",
      "pucAvailable",
      "serviceHistoryAvailable",
      "hasLoan",
    ],
  },
  { title: "Photos", fields: [] as string[] },
  { title: "Review & Consent", fields: ["consent"] },
] as const;

type StepFieldName = FieldPath<SubmissionValues>;

// Per-step schemas mirror STEPS above — used to give a clear, immediate reason
// when "Next" is blocked, instead of failing silently. (Photos/Review steps
// are validated separately, hence the nulls.)
const STEP_SCHEMAS = [ownerDetailsSchema, submissionVehicleDetailsSchema, submissionPriceLocationSchema, null, null] as const;

const FIELD_LABELS: Partial<Record<string, string>> = {
  name: "Full Name",
  phone: "Mobile",
  city: "City",
  vehicleType: "Vehicle Type",
  brand: "Brand",
  model: "Model",
  year: "Manufacturing Year",
  registrationYear: "Registration Year",
  kilometres: "KM Driven",
  fuelType: "Fuel Type",
  owners: "Number of Owners",
};

export function SellVehicleForm() {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ referenceNumber: string; trackingToken: string } | null>(null);

  const draft = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as Partial<SubmissionValues>) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SubmissionValues, unknown, SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      preferredContact: "WHATSAPP",
      isPriceNegotiable: false,
      rcAvailable: false,
      insuranceAvailable: false,
      pucAvailable: false,
      serviceHistoryAvailable: false,
      hasLoan: false,
      ...draft,
    },
  });

  // Persist non-sensitive progress to sessionStorage; never persisted permanently, cleared on success.
  useEffect(() => {
    const subscription = watch((values) => {
      try {
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        // sessionStorage may be unavailable (private browsing) — ignore.
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const goNext = async () => {
    const fields = STEPS[step].fields as StepFieldName[];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) {
        // Don't fail silently: trigger() flips `valid` synchronously with
        // formState, but the `errors` binding above can still be a render
        // behind at this point — re-validate this step's own slice of the
        // schema directly against the current values so the toast/scroll
        // target is always accurate, not stale.
        const stepSchema = STEP_SCHEMAS[step];
        const result = stepSchema?.safeParse(getValues());
        const firstIssue = result && !result.success ? result.error.issues[0] : undefined;
        const fieldName = firstIssue ? String(firstIssue.path[0] ?? "") : "";
        const label = FIELD_LABELS[fieldName];
        toast.error(
          firstIssue
            ? `${label ?? fieldName}: ${firstIssue.message}`
            : "Please correct the highlighted fields before continuing."
        );
        if (fieldName) {
          const el = document.getElementById(fieldName);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          if (el instanceof HTMLElement) el.focus();
        }
        return;
      }
    }
    if (step === 3 && images.length < 4) {
      toast.error("Please upload at least 4 photos.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: SubmissionInput) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        fd.set(key, String(value));
      });
      images.forEach((img) => fd.append("images", img.file, img.file.name));

      const result = await createSubmission(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.sessionStorage.removeItem(DRAFT_KEY);
      setSuccess(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <SubmissionSuccessView referenceNumber={success.referenceNumber} trackingToken={success.trackingToken} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress indicator */}
      <ol className="mb-8 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </li>
        ))}
      </ol>
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
        Step {step + 1} of {STEPS.length}: {STEPS[step].title}
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {step === 0 && (
              <>
                <Field label="Full Name *" id="name" error={errors.name?.message}>
                  <Input {...register("name")} />
                </Field>
                <Field label="Mobile *" id="phone" error={errors.phone?.message}>
                  <Input type="tel" inputMode="tel" {...register("phone")} />
                </Field>
                <Field label="Email" id="email">
                  <Input type="email" {...register("email")} />
                </Field>
                <Field label="City *" id="city" error={errors.city?.message}>
                  <Input {...register("city")} />
                </Field>
                <Field label="State" id="state">
                  <Input {...register("state")} />
                </Field>
                <Field label="Preferred Contact Method" id="preferredContact">
                  <Controller
                    control={control}
                    name="preferredContact"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="preferredContact"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PREFERRED_CONTACT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Vehicle Type *" id="vehicleType" error={errors.vehicleType?.message}>
                  <Controller
                    control={control}
                    name="vehicleType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="vehicleType"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Brand *" id="brand" error={errors.brand?.message}>
                  <Input {...register("brand")} />
                </Field>
                <Field label="Model *" id="model" error={errors.model?.message}>
                  <Input {...register("model")} />
                </Field>
                <Field label="Variant" id="variant">
                  <Input {...register("variant")} />
                </Field>
                <Field label="Manufacturing Year *" id="year" error={errors.year?.message}>
                  <Input type="number" inputMode="numeric" {...register("year")} />
                </Field>
                <Field label="Registration Year" id="registrationYear">
                  <Input type="number" inputMode="numeric" {...register("registrationYear")} />
                </Field>
                <Field label="Registration Number" id="registrationNumber">
                  <Input {...register("registrationNumber")} />
                </Field>
                <Field label="KM Driven *" id="kilometres" error={errors.kilometres?.message}>
                  <Input type="number" inputMode="numeric" {...register("kilometres")} />
                </Field>
                <Field label="Fuel Type *" id="fuelType" error={errors.fuelType?.message}>
                  <Controller
                    control={control}
                    name="fuelType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="fuelType"><SelectValue placeholder="Select fuel" /></SelectTrigger>
                        <SelectContent>
                          {FUEL_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
                        <SelectTrigger id="transmission"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                        <SelectContent>
                          {TRANSMISSION_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Engine Capacity" id="engine">
                  <Input {...register("engine")} placeholder="e.g. 1197 cc" />
                </Field>
                <Field label="Colour" id="color">
                  <Input {...register("color")} />
                </Field>
                <Field label="Number of Owners" id="owners">
                  <Input type="number" inputMode="numeric" {...register("owners")} />
                </Field>
                <Field label="Condition" id="condition">
                  <Controller
                    control={control}
                    name="condition"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="condition"><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Expected Selling Price (₹)" id="expectedPrice">
                  <Input type="number" inputMode="numeric" {...register("expectedPrice")} />
                </Field>
                <div className="flex items-center gap-2">
                  <CheckboxField control={control} name="isPriceNegotiable" id="isPriceNegotiable" />
                  <Label htmlFor="isPriceNegotiable">Price negotiable</Label>
                </div>
                <Field label="PIN Code" id="pincode">
                  <Input inputMode="numeric" {...register("pincode")} />
                </Field>
                <Field label="Vehicle Location" id="vehicleLocation">
                  <Input {...register("vehicleLocation")} placeholder="Area / landmark" />
                </Field>
                <Field label="Tell us about your vehicle" id="description">
                  <Textarea rows={4} {...register("description")} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
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
                </div>
              </>
            )}

            {step === 3 && (
              <div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Add at least 4 photos (front, rear, sides, interior, dashboard) — up to 15. Use your camera or
                  choose from your gallery.
                </p>
                <ImageUploader images={images} onChange={setImages} minImages={4} maxImages={15} />
              </div>
            )}

            {step === 4 && (
              <SubmissionReview
                values={watch()}
                imageCount={images.length}
                control={control}
                errors={errors}
                registerHoneypot={register}
              />
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack} className="flex-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="flex-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Vehicle for Review
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactElement<{ id?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, { id })}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function CheckboxField({
  control,
  name,
  id,
}: {
  control: ReturnType<typeof useForm<SubmissionValues, unknown, SubmissionInput>>["control"];
  name: StepFieldName;
  id?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Checkbox id={id} checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(Boolean(v))} />
      )}
    />
  );
}

function SubmissionReview({
  values,
  imageCount,
  control,
  errors,
  registerHoneypot,
}: {
  values: Partial<SubmissionValues>;
  imageCount: number;
  control: ReturnType<typeof useForm<SubmissionValues, unknown, SubmissionInput>>["control"];
  errors: ReturnType<typeof useForm<SubmissionValues, unknown, SubmissionInput>>["formState"]["errors"];
  registerHoneypot: ReturnType<typeof useForm<SubmissionValues, unknown, SubmissionInput>>["register"];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-md bg-secondary p-4 text-sm">
        <p><strong>{values.name}</strong> · {values.phone}</p>
        <p>
          {String(values.year ?? "")} {values.brand} {values.model} {values.variant}
        </p>
        <p>{values.kilometres ? `${String(values.kilometres)} km` : ""} · {values.fuelType}</p>
        <p>{values.city}{values.state ? `, ${values.state}` : ""}</p>
        <p>{imageCount} photo(s) attached</p>
        {values.expectedPrice ? <p>Expected price: ₹{String(values.expectedPrice)}</p> : null}
      </div>
      <div className="flex items-start gap-2">
        <CheckboxField control={control} name="consent" id="consent" />
        <Label htmlFor="consent" className="text-sm font-normal leading-snug">
          I confirm that the information provided is accurate and I am authorized to sell this vehicle. I agree to
          be contacted regarding this submission.
        </Label>
      </div>
      {errors.consent && <p className="text-sm text-destructive">{errors.consent.message as string}</p>}
      {/* Honeypot field — hidden from real users, bots often fill it */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...registerHoneypot("website")}
      />
    </div>
  );
}
