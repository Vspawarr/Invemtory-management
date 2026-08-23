"use client";

import { ErrorState } from "@/components/common/error-state";

export default function FarmerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} />;
}
