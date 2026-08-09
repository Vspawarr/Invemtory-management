'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TournamentRule } from '@/types/database';
import { addRule, updateRule, deleteRule, reorderRule } from '@/lib/actions/rules';

export default function RulesEditor({
  tournamentId,
  rules,
}: {
  tournamentId: string;
  rules: TournamentRule[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newRule, setNewRule] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <div key={rule.id} className="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm">
          <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
            {i + 1}
          </span>
          <textarea
            defaultValue={rule.rule_text}
            onChange={(e) => setDrafts((d) => ({ ...d, [rule.id]: e.target.value }))}
            rows={2}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-col gap-1">
            <button disabled={pending || i === 0} onClick={() => run(() => reorderRule(rule.id, 'up', tournamentId))} className="rounded bg-slate-100 px-2 py-1 text-xs disabled:opacity-30">
              ↑
            </button>
            <button disabled={pending || i === rules.length - 1} onClick={() => run(() => reorderRule(rule.id, 'down', tournamentId))} className="rounded bg-slate-100 px-2 py-1 text-xs disabled:opacity-30">
              ↓
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <button
              disabled={pending}
              onClick={() => run(() => updateRule(rule.id, drafts[rule.id] ?? rule.rule_text))}
              className="rounded bg-navy-900 px-2 py-1 text-xs font-bold text-white"
            >
              Save
            </button>
            <button
              disabled={pending}
              onClick={() => {
                if (confirm('Delete this rule?')) run(() => deleteRule(rule.id));
              }}
              className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase text-slate-500">Add Rule</p>
        <div className="flex gap-2">
          <input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="New rule text…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            disabled={pending || !newRule.trim()}
            onClick={() =>
              run(async () => {
                await addRule(tournamentId, newRule.trim());
                setNewRule('');
              })
            }
            className="rounded-lg bg-navy-900 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
