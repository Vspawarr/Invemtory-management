import { Badge } from "@/components/ui/badge";

export function VehicleStatusBadge({ status }: { status: string }) {
  if (status === "RESERVED") {
    return (
      <Badge variant="warning" className="uppercase tracking-wide">
        Reserved
      </Badge>
    );
  }
  if (status === "SOLD") {
    return (
      <Badge variant="muted" className="uppercase tracking-wide">
        Sold
      </Badge>
    );
  }
  return null;
}
