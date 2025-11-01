import { saveData } from '@/lib/aws-dynamodb';
import type { BusinessData } from '@/lib/types';

export async function saveSpreadsheetData(data: BusinessData[]) {
  const result = await saveData(data);

  if (result.success) {
    return { success: true, message: 'Data saved successfully!' };
  } else {
    return { success: false, error: result.error };
  }
}
