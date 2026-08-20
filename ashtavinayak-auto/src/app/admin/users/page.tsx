import { requireSuperAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminUserDialog } from "@/components/admin/admin-user-dialog";
import { AdminUserRow } from "@/components/admin/admin-user-row";
import { format } from "date-fns";

export const metadata = { title: "Admins" };

export default async function AdminUsersPage() {
  const me = await requireSuperAdmin();
  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SALES"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-sm text-muted-foreground">Manage staff access. Only super admins can manage admins.</p>
        </div>
        <AdminUserDialog />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <AdminUserRow
                key={u.id}
                isSelf={u.id === me.id}
                user={{
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  isActive: u.isActive,
                  createdAt: format(u.createdAt, "dd MMM yyyy"),
                }}
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
