import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { MarkReadButton, MarkAllReadButton } from "@/components/admin/notification-actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

const PAGE_SIZE = 25;

export default async function AdminNotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count(),
    prisma.notification.count({ where: { readAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread of {total} total</p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={cn("p-4", !n.readAt && "border-accent/50 bg-accent/5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {!n.readAt && <Badge variant="accent">New</Badge>}
                  <p className="font-medium">
                    {n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}
                  </p>
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{format(n.createdAt, "dd MMM yyyy, HH:mm")}</p>
              </div>
              {!n.readAt && <MarkReadButton id={n.id} />}
            </div>
          </Card>
        ))}
        {notifications.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No notifications yet.</Card>
        )}
      </div>

      <AdminPagination total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}
