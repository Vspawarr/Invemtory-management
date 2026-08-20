import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return inrFormatter.format(value);
}

const numberFormatter = new Intl.NumberFormat("en-IN");

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return numberFormatter.format(value);
}
