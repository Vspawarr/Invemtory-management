import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { CallbackStatusSelect } from "@/components/admin/callback-status-select";
import { WhatsAppContactPanel } from "@/components/admin/whatsapp-contact-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const metadata = { title: "Callback Requests" };

const PAGE_SIZE = 20;

export default async function AdminCallbacksPage({ searchParams }: PageProps<"/admin/callbacks">) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [callbacks, total] = await Promise.all([
    prisma.callbackRequest.findMany({
      include: { vehicle: { select: { slug: true, brand: true, model: true, year: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.callbackRequest.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Callback Requests</h1>
        <p className="text-sm text-muted-foreground">{total} request(s)</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Preferred Time</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">WhatsApp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callbacks.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.preferredTime || "—"}</TableCell>
                <TableCell>
                  {c.vehicle ? (
                    <Link href={`/vehicles/${c.vehicle.slug}`} target="_blank" className="underline">
                      {c.vehicle.year} {c.vehicle.brand} {c.vehicle.model}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs">{format(c.createdAt, "dd MMM yyyy")}</TableCell>
                <TableCell><CallbackStatusSelect id={c.id} status={c.status} /></TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="whatsapp">
                        <MessageCircle className="h-4 w-4" /> Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>WhatsApp {c.name}</DialogTitle></DialogHeader>
                      <WhatsAppContactPanel
                        title="Message"
                        phone={c.phone}
                        defaultMessage={`Hello ${c.name},\n\nThis is Ashtavinayak Auto Consultant. You requested a callback${c.preferredTime ? ` around ${c.preferredTime}` : ""}. How can we help?`}
                      />
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {callbacks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No callback requests yet.
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
