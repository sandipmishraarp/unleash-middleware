'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { setSetting } from '@/lib/settings';
import { log } from '@/lib/logger';

const schema = z.object({
  username: z.string().min(1),
  secret: z.string().min(1),
});

export async function saveRoarSettings(formData: FormData) {
  const data = schema.safeParse({
    username: formData.get('username'),
    secret: formData.get('secret'),
  });
  if (!data.success) {
    log({ module: 'settings', action: 'save', ok: false, err: data.error.flatten() });
    throw new Error('Invalid form data');
  }
  await Promise.all([
    setSetting('ROAR_USERNAME', data.data.username),
    setSetting('ROAR_SECRET', data.data.secret),
  ]);
  log({ module: 'settings', action: 'save', ok: true });
  revalidatePath('/settings');
  revalidatePath('/');
}
