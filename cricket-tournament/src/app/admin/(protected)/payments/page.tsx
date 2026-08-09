import { getAdminPayments } from '@/lib/actions/queries-admin';
import PaymentRow from '@/components/admin/PaymentRow';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();
  const paidTotal = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase text-navy-900">Payments</h1>
          <p className="text-sm text-slate-500">{payments.length} payment records</p>
        </div>
        <div className="rounded-xl bg-navy-900 px-4 py-2 text-white">
          <p className="text-[10px] uppercase tracking-wide text-gold-300">Total Collected</p>
          <p className="text-lg font-black">₹{paidTotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Reg #</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Amount</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Method</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Reference</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Notes</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Save</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="p-4 text-sm text-slate-500">No payments yet.</p>}
      </div>
    </div>
  );
}
