// 'use server';

// import { revalidatePath } from 'next/cache';
// import { RESOURCE_KEYS, UNLEASHED_RESOURCES } from '@/lib/resources';
// import { runUnleashedProbe } from '@/lib/probeRunner';
// import type { UnleashedResource } from '@/lib/unleashedClient';

// export async function runProbeAction(formData: FormData) {
//   const resource = String(formData.get('resource') ?? '');
//   const match = UNLEASHED_RESOURCES.find((item) => item === resource);

//   if (!match) {
//     throw new Error('Invalid resource');
//   }

//   await runUnleashedProbe(match as UnleashedResource);
//   revalidatePath('/');
//   revalidatePath(`/logs/${RESOURCE_KEYS[match]}`);
// }
