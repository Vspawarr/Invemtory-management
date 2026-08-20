import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: "BUYER" },
      include: { _count: { select: { enquiries: true, favourites: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: { role: "BUYER" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {total} registered buyer(s). Sellers who submit vehicles via &ldquo;Sell Your Vehicle&rdquo; do not need an
          account and are tracked separately in Vehicle Submissions.
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Enquiries</TableHead>
              <TableHead>Favourites</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone || "—"}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell className="text-xs">{format(c.createdAt, "dd MMM yyyy")}</TableCell>
                <TableCell>{c._count.enquiries}</TableCell>
                <TableCell>{c._count.favourites}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "success" : "muted"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No registered buyers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminPagination total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}
