import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Admin Portal" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const unreadCount = await prisma.notification.count({ where: { readAt: null } });

  return (
    <AdminShell userName={user.name} role={user.role} unreadCount={unreadCount}>
      {children}
    </AdminShell>
  );
}
