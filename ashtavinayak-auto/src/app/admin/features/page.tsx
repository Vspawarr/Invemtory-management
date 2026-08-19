import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FeatureFormDialog } from "@/components/admin/feature-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteFeature } from "@/actions/features";

export const metadata = { title: "Features" };

export default async function AdminFeaturesPage() {
  const features = await prisma.feature.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { vehicles: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Features</h1>
          <p className="text-sm text-muted-foreground">Manage standard vehicle features (AC, ABS, Sunroof, etc.)</p>
        </div>
        <FeatureFormDialog />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Used by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{f._count.vehicles} vehicles</TableCell>
                <TableCell>
                  <Badge variant={f.isActive ? "success" : "muted"}>{f.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>{f.sortOrder}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <FeatureFormDialog feature={f} />
                  <DeleteButton id={f.id} action={deleteFeature} title={`Delete "${f.name}"?`} />
                </TableCell>
              </TableRow>
            ))}
            {features.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No features yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
