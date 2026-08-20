import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/public/profile-form";

export default async function AccountProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  return <ProfileForm defaultName={user.name} email={user.email} defaultPhone={user.phone ?? ""} />;
}
