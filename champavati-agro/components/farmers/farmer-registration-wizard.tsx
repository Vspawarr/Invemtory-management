"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  createFarmerWithLand,
  type FarmerRegistrationInput,
} from "@/lib/server/actions/farmers";
import { cn } from "@/lib/utils";

const STEPS = ["Personal Information", "Address", "Land"] as const;

const STEP_FIELDS: (keyof FarmerRegistrationInput)[][] = [
  ["fullName", "phone", "aadhaar"],
  ["village", "taluka", "district", "state"],
  ["land"],
];

export function FarmerRegistrationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FarmerRegistrationInput>({
    defaultValues: {
      village: "Chapaner",
      taluka: "Kannad",
      district: "Chhatrapati Sambhajinagar",
      state: "Maharashtra",
      land: [{ name: "", areaAcres: 0, village: "Chapaner" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "land" });

  async function next() {
    const valid = await trigger(STEP_FIELDS[step] as never, { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: FarmerRegistrationInput) {
    setSubmitting(true);
    const result = await createFarmerWithLand(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${values.fullName} added successfully.`);
    router.push(`/admin/farmers/${result.data.farmerId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary text-primary",
                i > step && "border-border text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:block",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input id="fullName" {...register("fullName", { required: true })} />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherOrHusbandName">Father&apos;s / Husband&apos;s name</Label>
                      <Input id="fatherOrHusbandName" {...register("fatherOrHusbandName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Input id="gender" placeholder="Male / Female / Other" {...register("gender")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile number</Label>
                      <Input id="phone" placeholder="98765xxxxx" {...register("phone", { required: true })} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altPhone">Alternate mobile</Label>
                      <Input id="altPhone" {...register("altPhone")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input id="dob" type="date" {...register("dob")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar number (optional)</Label>
                      <Input id="aadhaar" placeholder="12-digit Aadhaar" {...register("aadhaar")} />
                      {errors.aadhaar && (
                        <p className="text-xs text-destructive">{errors.aadhaar.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Stored encrypted and shown masked. Only an admin can reveal the full number, and every reveal is logged.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...register("address")} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="village">Village</Label>
                      <Input id="village" {...register("village", { required: true })} />
                      {errors.village && <p className="text-xs text-destructive">{errors.village.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taluka">Taluka</Label>
                      <Input id="taluka" {...register("taluka", { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input id="district" {...register("district", { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...register("state", { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN code</Label>
                      <Input id="pincode" {...register("pincode")} />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">Land parcel {index + 1}</p>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`land-${index}-name`}>Parcel name / Gat no.</Label>
                          <Input id={`land-${index}-name`} {...register(`land.${index}.name`, { required: true })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`land-${index}-surveyNo`}>Survey / Gat number</Label>
                          <Input id={`land-${index}-surveyNo`} {...register(`land.${index}.surveyNo`)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`land-${index}-areaAcres`}>Area (acres)</Label>
                          <Input
                            id={`land-${index}-areaAcres`}
                            type="number"
                            step="0.01"
                            {...register(`land.${index}.areaAcres`, { required: true, valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`land-${index}-village`}>Village</Label>
                          <Input id={`land-${index}-village`} {...register(`land.${index}.village`, { required: true })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`land-${index}-soilType`}>Soil type</Label>
                          <Input id={`land-${index}-soilType`} {...register(`land.${index}.soilType`)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`land-${index}-waterSource`}>Water source</Label>
                          <Input id={`land-${index}-waterSource`} {...register(`land.${index}.waterSource`)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.land?.message && (
                    <p className="text-xs text-destructive">{errors.land.message as string}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", areaAcres: 0, village: "Chapaner" })}
                  >
                    <Plus className="size-4" /> Add another parcel
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save farmer"
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
