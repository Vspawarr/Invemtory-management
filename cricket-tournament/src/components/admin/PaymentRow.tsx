'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePayment } from '@/lib/actions/payments';
import type { AdminPaymentRow } from '@/lib/actions/queries-admin';
import type { PaymentMethod, PaymentStatus } from '@/types/database';

const STATUS_OPTIONS: PaymentStatus[] = ['PENDING', 'PAID', 'REFUNDED', 'CANCELLED'];
const METHOD_OPTIONS: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'];

export default function PaymentRow({ payment }: { payment: AdminPaymentRow }) {
  const [status, setStatus] = useState(payment.status);
  const [method, setMethod] = useState(payment.payment_method ?? '');
  const [reference, setReference] = useState(payment.transaction_reference ?? '');
  const [amount, setAmount] = useState(payment.amount);
  const [notes, setNotes] = useState(payment.notes ?? '');
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function save() {
    startTransition(async () => {
      await updatePayment(payment.id, {
        status,
        payment_method: (method || null) as PaymentMethod | null,
        transaction_reference: reference || null,
        amount,
        notes: notes || null,
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2 font-mono text-xs font-bold text-navy-900">{payment.registration_number}</td>
      <td className="px-3 py-2 font-semibold">{payment.team_name}</td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="">—</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ref #"
          className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="w-32 rounded border border-slate-300 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </td>
    </tr>
  );
}
