import SpreadsheetTable from '@/components/spreadsheet-table';
import { getData } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Home() {
  const initialData = await getData();
  
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
          Spreadsheet Saver
        </h1>
      </header>
      <main className="p-4 sm:px-6 sm:py-0">
        <SpreadsheetTable initialData={initialData} />
      </main>
    </div>
  );
}
