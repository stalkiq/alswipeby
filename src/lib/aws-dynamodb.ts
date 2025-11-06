import type { BusinessData } from './types';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || process.env.API_GATEWAY_URL;

if (!API_GATEWAY_URL) {
  console.warn('API_GATEWAY_URL not set, using mock data');
}

/**
 * Fetch all business data from DynamoDB via API Gateway
 */
export async function getData(): Promise<BusinessData[]> {
  if (!API_GATEWAY_URL) {
    console.log('Using mock data (API Gateway URL not configured)');
    return getMockData();
  }

  try {
    console.log('Fetching data from AWS DynamoDB...');
    const response = await fetch(`${API_GATEWAY_URL}/businesses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      console.log(`Successfully fetched ${result.count} records from DynamoDB`);
      return result.data;
    } else {
      throw new Error(result.error || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching data from AWS:', error);
    // Fallback to mock data on error
    console.log('Falling back to mock data');
    return getMockData();
  }
}

/**
 * Save business data to DynamoDB via API Gateway
 */
export async function saveData(
  data: BusinessData[]
): Promise<{ success: true; data?: BusinessData[] } | { success: false; error: string }> {
  if (!API_GATEWAY_URL) {
    console.log('Using mock data save (API Gateway URL not configured)');
    return mockSaveData(data);
  }

  try {
    console.log(`Saving ${data.length} records to AWS DynamoDB...`);
    const response = await fetch(`${API_GATEWAY_URL}/businesses/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log(`Successfully saved ${result.count} records to DynamoDB`);
      return { success: true, data: result.data };
    } else {
      throw new Error(result.error || 'Failed to save data');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error saving data to AWS:', message);
    return { success: false, error: message };
  }
}

// ==========================================
// Mock Data Functions (Fallback)
// ==========================================

let mockDatabase: BusinessData[] = [
  {
    docId: '1',
    businessName: 'The Coffee Shop',
    address: '123 Main St, Anytown, 12345',
    phone: '555-1234',
    website: 'https://coffeeshop.com',
    google: '',
    instagramUrl: 'https://instagram.com/coffeeshop',
    notes: 'A popular spot for locals. Great espresso.',
    contactStage: 'New Lead',
  },
  {
    docId: '2',
    businessName: 'Bookworm Reads',
    address: '456 Oak Ave, Reader-ville, 54321',
    phone: '555-5678',
    website: 'https://bookwormreads.com',
    google: '',
    instagramUrl: 'https://instagram.com/bookwormreads',
    notes: 'Cozy atmosphere. Has a rare books section in the back.',
    contactStage: 'New Lead',
  },
];

function getMockData(): BusinessData[] {
  console.log('Fetching data from mock database...');
  return JSON.parse(JSON.stringify(mockDatabase));
}

const generateId = () => Math.random().toString(36).substring(2, 15);

function mockSaveData(
  data: BusinessData[]
): { success: true } | { success: false; error: string } {
  console.log('Saving data to mock database:', data);
  try {
    mockDatabase = JSON.parse(
      JSON.stringify(
        data.map((row) => ({
          ...row,
          docId: row.docId || generateId(),
        }))
      )
    );
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Failed to save data:', message);
    return { success: false, error: message };
  }
}

