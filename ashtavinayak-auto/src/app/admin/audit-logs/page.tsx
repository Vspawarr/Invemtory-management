import { format } from "date-fns";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const metadata = { title: "Audit Logs" };

const PAGE_SIZE = 40;

export default async function AdminAuditLogsPage({ searchParams }: PageProps<"/admin/audit-logs">) {
  await requireSuperAdmin();

  const params = await searchParams;
  const entity = typeof params.entity === "string" ? params.entity : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where = entity ? { entity: { contains: entity, mode: "insensitive" as const } } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">{total} event(s) recorded</p>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap gap-3" method="get">
          <Input name="entity" placeholder="Filter by entity (Vehicle, Enquiry, ...)" defaultValue={entity} className="max-w-xs" />
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>By</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell><Badge variant="secondary" className="font-mono text-[11px]">{log.action}</Badge></TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId ?? "—"}</TableCell>
                <TableCell>{log.user?.name ?? "System"}</TableCell>
                <TableCell className="text-xs">{format(log.createdAt, "dd MMM yyyy, HH:mm:ss")}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No audit events match your filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminPagination total={total} page={page} pageSize={PAGE_SIZE} searchParams={{ entity }} />
    </div>
  );
}
