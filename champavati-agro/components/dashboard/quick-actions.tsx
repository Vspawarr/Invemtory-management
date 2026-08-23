import Link from "next/link";
import { CalendarPlus, PackagePlus, Sprout, UserPlus } from "lucide-react";

const ACTIONS = [
  { label: "Add Farmer", href: "/admin/farmers/new", icon: UserPlus },
  { label: "Add Crop", href: "/admin/crops/new", icon: Sprout },
  { label: "Add Product", href: "/admin/products", icon: PackagePlus },
  { label: "Follow-ups", href: "/admin/followups", icon: CalendarPlus },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <action.icon className="size-4" />
          </span>
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
