import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategory } from "@/actions/categories";
import { VEHICLE_TYPE_OPTIONS } from "@/lib/vehicle-options";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { vehicles: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage vehicle categories shown on the public site.</p>
        </div>
        <CategoryFormDialog />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                <TableCell>
                  {VEHICLE_TYPE_OPTIONS.find((o) => o.value === cat.vehicleType)?.label}
                </TableCell>
                <TableCell>{cat._count.vehicles}</TableCell>
                <TableCell>
                  <Badge variant={cat.isActive ? "success" : "muted"}>
                    {cat.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{cat.sortOrder}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <CategoryFormDialog category={cat} />
                  <DeleteButton
                    id={cat.id}
                    action={deleteCategory}
                    title={`Delete "${cat.name}"?`}
                    description="Categories that still have vehicles cannot be deleted."
                  />
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
