import SpreadsheetTable from '@/components/spreadsheet-table';
import { getData } from '@/lib/aws-dynamodb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Home() {
  const initialData = await getData();
  
  return (
    <div className="min-h-screen w-full">
      <main className="p-4 sm:px-6 sm:py-0 pt-14">
        <SpreadsheetTable initialData={initialData} />
      </main>
    </div>
  );
}
