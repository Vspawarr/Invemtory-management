"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Car,
  Inbox,
  MessageSquare,
  Users,
  FolderTree,
  ListChecks,
  ShieldCheck,
  Settings,
  ScrollText,
  Bell,
  LogOut,
  Menu,
  PhoneCall,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@prisma/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "SALES"] },
  { href: "/admin/vehicles", label: "Inventory", icon: Car, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/submissions", label: "Vehicle Submissions", icon: Inbox, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, roles: ["SUPER_ADMIN", "ADMIN", "SALES"] },
  { href: "/admin/callbacks", label: "Callback Requests", icon: PhoneCall, roles: ["SUPER_ADMIN", "ADMIN", "SALES"] },
  { href: "/admin/customers", label: "Customers", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "SALES"] },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/features", label: "Features", icon: ListChecks, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/users", label: "Admins", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["SUPER_ADMIN"] },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["SUPER_ADMIN"] },
];

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.filter((item) => item.roles.includes(role)).map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground/80 hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  userName,
  role,
  unreadCount,
}: {
  children: React.ReactNode;
  userName: string;
  role: Role;
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold leading-tight">
            Ashtavinayak
            <br />
            Admin Portal
          </span>
        </div>
        <div className="py-4">
          <NavLinks role={role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                <div className="flex h-16 items-center gap-2 border-b px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Car className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold">Admin Portal</span>
                </div>
                <div className="py-4">
                  <NavLinks role={role} onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="accent"
                    className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
