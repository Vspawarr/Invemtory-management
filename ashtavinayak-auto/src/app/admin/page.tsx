import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getInventoryByCategory,
  getInventoryBySource,
  getInventoryByStatus,
  getTopBrands,
  getMonthlyEnquiries,
  getSubmissionFunnel,
} from "@/lib/queries/dashboard";
import {
  CategoryBarChart,
  SourcePieChart,
  StatusBarChart,
  BrandBarChart,
  EnquiriesLineChart,
  SubmissionFunnelChart,
} from "@/components/admin/dashboard-charts";

export const metadata = { title: "Dashboard" };

async function getStats() {
  const [
    totalInventory,
    businessStock,
    customerSubmitted,
    available,
    reserved,
    sold,
    pendingSubmissions,
    newEnquiries,
    callbackRequests,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { source: "BUSINESS_STOCK" } }),
    prisma.vehicle.count({ where: { source: "CUSTOMER_SUBMITTED" } }),
    prisma.vehicle.count({ where: { status: "LISTED" } }),
    prisma.vehicle.count({ where: { status: "RESERVED" } }),
    prisma.vehicle.count({ where: { status: "SOLD" } }),
    prisma.vehicleSubmission.count({ where: { status: { in: ["PENDING_REVIEW", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"] } } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.callbackRequest.count({ where: { status: "PENDING" } }),
  ]);
  return {
    totalInventory,
    businessStock,
    customerSubmitted,
    available,
    reserved,
    sold,
    pendingSubmissions,
    newEnquiries,
    callbackRequests,
  };
}

export default async function AdminDashboardPage() {
  const [stats, byCategory, bySource, byStatus, topBrands, monthlyEnquiries, funnel] = await Promise.all([
    getStats(),
    getInventoryByCategory(),
    getInventoryBySource(),
    getInventoryByStatus(),
    getTopBrands(),
    getMonthlyEnquiries(),
    getSubmissionFunnel(),
  ]);

  const cards: { label: string; value: number; href: string }[] = [
    { label: "Total Inventory", value: stats.totalInventory, href: "/admin/vehicles" },
    { label: "Business Stock", value: stats.businessStock, href: "/admin/vehicles?source=BUSINESS_STOCK" },
    { label: "Customer Submitted", value: stats.customerSubmitted, href: "/admin/vehicles?source=CUSTOMER_SUBMITTED" },
    { label: "Available (Listed)", value: stats.available, href: "/admin/vehicles?status=LISTED" },
    { label: "Reserved", value: stats.reserved, href: "/admin/vehicles?status=RESERVED" },
    { label: "Sold", value: stats.sold, href: "/admin/vehicles?status=SOLD" },
    { label: "Pending Submissions", value: stats.pendingSubmissions, href: "/admin/submissions" },
    { label: "New Enquiries", value: stats.newEnquiries, href: "/admin/enquiries" },
    { label: "Callback Requests", value: stats.callbackRequests, href: "/admin/callbacks" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live figures from the database — updated in real time.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryBarChart data={byCategory} />
        <SourcePieChart data={bySource} />
        <StatusBarChart data={byStatus} />
        <BrandBarChart data={topBrands} />
        <EnquiriesLineChart data={monthlyEnquiries} />
        <SubmissionFunnelChart data={funnel} />
      </div>
    </div>
  );
}
