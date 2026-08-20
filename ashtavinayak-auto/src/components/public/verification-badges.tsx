import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerificationBadges({
  rcAvailable,
  insuranceAvailable,
  pucAvailable,
  serviceHistoryAvailable,
  hasLoan,
}: {
  rcAvailable: boolean;
  insuranceAvailable: boolean;
  pucAvailable: boolean;
  serviceHistoryAvailable: boolean;
  hasLoan: boolean;
}) {
  const items = [
    { label: "RC Available", ok: rcAvailable },
    { label: "Insurance Available", ok: insuranceAvailable },
    { label: "PUC Available", ok: pucAvailable },
    { label: "Service History", ok: serviceHistoryAvailable },
    { label: hasLoan ? "Loan / Hypothecation Pending" : "No Loan / Hypothecation", ok: !hasLoan },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
            item.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-muted bg-secondary/50 text-muted-foreground"
          )}
        >
          {item.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {item.label}
        </div>
      ))}
    </div>
  );
}
