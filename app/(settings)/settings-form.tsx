'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveUnleashedCredentials } from './actions';

interface SettingsFormProps {
  hasApiId: boolean;
  hasApiKey: boolean;
}

const initialState = { message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
    >
      {pending ? 'Saving…' : 'Save Credentials'}
    </button>
  );
}

export function SettingsForm({ hasApiId, hasApiKey }: SettingsFormProps) {
  const [state, formAction] = useFormState(saveUnleashedCredentials, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="apiId" className="block text-sm font-medium text-slate-700">
          Unleashed API ID
        </label>
        <input
          id="apiId"
          name="apiId"
          type="password"
          placeholder={hasApiId ? '••••••••••••' : 'Enter your API ID'}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          autoComplete="off"
          required
        />
        {hasApiId && (
          <p className="mt-1 text-xs text-slate-500">Existing credential stored securely.</p>
        )}
      </div>

      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700">
          Unleashed API Key
        </label>
        <input
          id="apiKey"
          name="apiKey"
          type="password"
          placeholder={hasApiKey ? '••••••••••••' : 'Enter your API Key'}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          autoComplete="off"
          required
        />
        {hasApiKey && (
          <p className="mt-1 text-xs text-slate-500">Existing credential stored securely.</p>
        )}
      </div>

      {state.message && <p className="text-sm text-slate-600">{state.message}</p>}

      <SubmitButton />
    </form>
  );
}
