import { listSecrets } from '@/lib/settings';
import { saveRoarSettings } from './actions';

export default async function SettingsPage() {
  const secrets = await listSecrets();
  const usernameSaved = secrets.find((s) => s.key === 'ROAR_USERNAME')?.hasValue;
  const secretSaved = secrets.find((s) => s.key === 'ROAR_SECRET')?.hasValue;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-slate-400">
          Manage integration credentials. Secrets are encrypted at rest.
        </p>
      </div>

      <form action={saveRoarSettings} className="card space-y-4 max-w-xl">
        <h3 className="text-lg font-medium">ROar Credentials</h3>
        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            placeholder={usernameSaved ? '••••••' : 'ROar username'}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          {usernameSaved && <p className="mt-1 text-xs text-emerald-400">Stored & masked</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="secret">
            Secret
          </label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            placeholder={secretSaved ? '••••••' : 'ROar secret'}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          {secretSaved && <p className="mt-1 text-xs text-emerald-400">Stored & masked</p>}
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          Save
        </button>
      </form>
    </div>
  );
}
