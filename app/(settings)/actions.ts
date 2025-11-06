'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { saveSecret } from '@/lib/secrets';

const schema = z.object({
  apiId: z.string().min(3),
  apiKey: z.string().min(10),
});

export async function saveUnleashedCredentials(prevState: { message: string }, formData: FormData) {
  const values = {
    apiId: String(formData.get('apiId') ?? ''),
    apiKey: String(formData.get('apiKey') ?? ''),
  };

  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return {
      message: 'Invalid credentials provided. Ensure both fields are populated.',
    };
  }

  await saveSecret('UNLEASHED_API_ID', parsed.data.apiId.trim());
  await saveSecret('UNLEASHED_API_KEY', parsed.data.apiKey.trim());

  revalidatePath('/');

  return {
    message: 'Credentials saved successfully.',
  };
}
