import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FarmerBottomNav } from "@/components/layout/farmer-bottom-nav";
import { FarmerTopbar } from "@/components/layout/farmer-topbar";

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "FARMER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <FarmerTopbar />
      <main className="mx-auto max-w-lg pb-20 lg:max-w-2xl">{children}</main>
      <FarmerBottomNav />
    </div>
  );
}
