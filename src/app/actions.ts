"use server";

import { saveData } from '@/lib/firebase';
import type { BusinessData } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function saveSpreadsheetData(data: BusinessData[]) {
  const result = await saveData(data);

  if (result.success) {
    revalidatePath('/');
    return { success: true, message: 'Data saved successfully!' };
  } else {
    return { success: false, error: result.error };
  }
}
