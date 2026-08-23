import type { Metadata } from "next";
import { Package } from "lucide-react";

import { listProducts, listProductCategories } from "@/lib/server/dal/products";
import { listCropMasters } from "@/lib/server/dal/crop-master";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export const metadata: Metadata = { title: "Products — Champavati Agro" };

export default async function ProductsPage() {
  const [products, categories, cropMasters] = await Promise.all([
    listProducts(),
    listProductCategories(),
    listCropMasters(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products in the master list</p>
        </div>
        <ProductFormDialog categories={categories} cropMasters={cropMasters} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add seeds, fertilizers, pesticides, and other inputs to start recommending them."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Target crop</TableHead>
                <TableHead>Pack</TableHead>
                <TableHead>Selling price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.category.name}</Badge>
                  </TableCell>
                  <TableCell>{p.brand || "—"}</TableCell>
                  <TableCell>{p.targetCrop?.name || "—"}</TableCell>
                  <TableCell>{p.packSize}</TableCell>
                  <TableCell>₹{Number(p.sellingPrice).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
