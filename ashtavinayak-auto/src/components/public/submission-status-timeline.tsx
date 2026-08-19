import { Check, Circle, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMELINE_STEPS = [
  { key: "SUBMITTED", label: "Vehicle Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "LISTED", label: "Listed" },
] as const;

// Maps internal SubmissionStatus -> how far along the public timeline we are.
function timelineIndex(status: string): number {
  switch (status) {
    case "PENDING_REVIEW":
      return 0;
    case "UNDER_REVIEW":
    case "MORE_INFORMATION_REQUIRED":
      return 1;
    case "APPROVED":
      return 2;
    case "LISTED":
      return 3;
    default:
      return 0;
  }
}

export function SubmissionStatusTimeline({ status }: { status: string }) {
  if (status === "REJECTED") {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
        This submission was not approved. Our team may contact you with more information.
      </div>
    );
  }

  const current = timelineIndex(status);

  return (
    <ol className="flex items-center justify-between">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              {i > 0 && <div className={cn("h-0.5 flex-1", done || active ? "bg-primary" : "bg-muted")} />}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  done ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary text-primary" : "border-2 border-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : active ? <Dot className="h-5 w-5" /> : <Circle className="h-3 w-3" />}
              </div>
              {i < TIMELINE_STEPS.length - 1 && <div className={cn("h-0.5 flex-1", done ? "bg-primary" : "bg-muted")} />}
            </div>
            <span className={cn("mt-2 text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
