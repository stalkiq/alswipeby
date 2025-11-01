import type { BusinessData } from './types';

const generateId = () => Math.random().toString(36).substring(2, 15);

let mockDatabase: BusinessData[] = [
  {
    docId: '1',
    businessName: 'The Coffee Shop',
    street: '123 Main St',
    city: 'Anytown',
    zip: '12345',
    phone: '555-1234',
    category: 'Coffee',
    facebookUrl: 'https://facebook.com/coffeeshop',
    facebookLastPost: '2024-05-20',
    instagramUrl: 'https://instagram.com/coffeeshop',
    instagramPresent: 'Yes',
    website: 'https://coffeeshop.com',
    onlineOn: '2024-05-21',
    notes: 'A popular spot for locals. Great espresso.',
  },
  {
    docId: '2',
    businessName: 'Bookworm Reads',
    street: '456 Oak Ave',
    city: 'Reader-ville',
    zip: '54321',
    phone: '555-5678',
    category: 'Books',
    facebookUrl: '',
    facebookLastPost: '',
    instagramUrl: 'https://instagram.com/bookwormreads',
    instagramPresent: 'Yes',
    website: 'https://bookwormreads.com',
    onlineOn: '2024-05-22',
    notes: 'Cozy atmosphere. Has a rare books section in the back.',
  },
];


export async function getData(): Promise<BusinessData[]> {
  // In a real app, you'd fetch from Firestore here.
  console.log('Fetching data from mock database...');
  // Return a deep copy to prevent direct mutation of the mock database
  return Promise.resolve(JSON.parse(JSON.stringify(mockDatabase)));
}

export async function saveData(data: BusinessData[]): Promise<{ success: true } | { success: false, error: string }> {
  // In a real app, you'd perform a batch write to Firestore here.
  console.log('Saving data to mock database:', data);
  try {
    // Simple validation and assignment of new IDs if missing
    mockDatabase = JSON.parse(JSON.stringify(data.map(row => ({
      ...row,
      docId: row.docId || generateId()
    }))));
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Failed to save data:', message);
    return { success: false, error: message };
  }
}
