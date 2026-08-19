import { getAdmins } from '@/lib/actions/admins';
import { getCurrentAdmin } from '@/lib/auth';
import AdminsManager from '@/components/admin/AdminsManager';

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  const [admins, currentAdmin] = await Promise.all([getAdmins(), getCurrentAdmin()]);

  if (!currentAdmin) return null;

  if (currentAdmin.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-xl font-black uppercase text-navy-900">Admins</h1>
        <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          Only a super admin can add or remove other admin accounts. Ask an existing super admin to
          promote your account if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Admins</h1>
        <p className="text-sm text-slate-500">
          Anyone added here can log in at /admin and score matches, manage teams, and more.
        </p>
      </div>
      <AdminsManager admins={admins} currentAdminId={currentAdmin.id} />
    </div>
  );
}
