'use client';

import { useEffect, useState } from 'react';
import SpreadsheetTable from '@/components/spreadsheet-table';
import { getData } from '@/lib/aws-dynamodb';
import type { BusinessData } from '@/lib/types';

export default function Home() {
  const [initialData, setInitialData] = useState<BusinessData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getData();
        // Sort alphabetically by business name
        const sortedData = data.sort((a, b) => {
          const nameA = (a.businessName || '').toLowerCase();
          const nameB = (b.businessName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setInitialData(sortedData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setInitialData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full">
      <main className="p-4 sm:px-6 sm:py-0 pt-14">
        <SpreadsheetTable initialData={initialData} />
      </main>
    </div>
  );
}
