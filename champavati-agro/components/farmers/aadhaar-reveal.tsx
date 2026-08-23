"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { revealAadhaarAction } from "@/lib/server/actions/farmers";

export function AadhaarReveal({ documentId, masked }: { documentId: string; masked: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (value) {
      setValue(null);
      return;
    }
    setLoading(true);
    const result = await revealAadhaarAction(documentId);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setValue(result.data.value);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{value ?? masked}</span>
      <Button type="button" variant="ghost" size="sm" onClick={toggle} disabled={loading}>
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : value ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
        {value ? "Hide" : "Reveal"}
      </Button>
    </div>
  );
}
