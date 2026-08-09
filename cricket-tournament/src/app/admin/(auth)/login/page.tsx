import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-gold-500 text-xl font-black text-navy-900">
            🏏
          </span>
          <h1 className="text-lg font-black uppercase text-navy-900">Admin Login</h1>
          <p className="text-xs text-slate-500">Shivsankalp Yuva Pratishthan Cricket Tournament</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
