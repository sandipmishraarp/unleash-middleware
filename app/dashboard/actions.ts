'use server';

import { revalidatePath } from 'next/cache';
import {  UnleashedResource } from '@/lib/unleashedClient';
import { runUnleashedProbe } from '@/lib/probeRunner';


export async function runProbeAction(formData: FormData) {
  const resource = formData.get('resource') as UnleashedResource;

  await runUnleashedProbe(resource);
  // Revalidate the dashboard page after the probe run
  revalidatePath('/dashboard');
}
