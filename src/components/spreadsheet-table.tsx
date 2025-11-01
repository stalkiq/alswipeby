"use client";

import { useState, useTransition } from 'react';
import type { BusinessData } from '@/lib/types';
import { saveSpreadsheetData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';

const columns: { id: keyof Omit<BusinessData, 'docId'>; label: string }[] = [
    { id: 'businessName', label: 'Business Name' },
    { id: 'street', label: 'Street' },
    { id: 'city', label: 'City' },
    { id: 'zip', label: 'ZIP' },
    { id: 'phone', label: 'Phone' },
    { id: 'category', label: 'Category' },
    { id: 'facebookUrl', label: 'Facebook URL' },
    { id: 'facebookLastPost', label: 'Facebook Last Post' },
    { id: 'instagramUrl', label: 'Instagram URL' },
    { id: 'instagramPresent', label: 'Instagram Present' },
    { id: 'website', label: 'Website' },
    { id: 'onlineOn', label: 'Online on' },
];

export default function SpreadsheetTable({ initialData }: { initialData: BusinessData[] }) {
  const [data, setData] = useState<BusinessData[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInputChange = (rowIndex: number, columnId: keyof BusinessData, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
    setData(newData);
  };

  const addRow = () => {
    const newRow: BusinessData = {
      docId: '', // Will be generated on save
      businessName: '',
      street: '',
      city: '',
      zip: '',
      phone: '',
      category: '',
      facebookUrl: '',
      facebookLastPost: '',
      instagramUrl: '',
      instagramPresent: '',
      website: '',
      onlineOn: '',
    };
    setData([...data, newRow]);
  };

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    setData(newData);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveSpreadsheetData(data);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: result.error,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Add, edit, and save business details.</CardDescription>
        </div>
        <div className="flex gap-2 self-start md:self-center">
          <Button onClick={addRow} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <Button onClick={handleSave} disabled={isPending} variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto rounded-md border">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>
                ))}
                <TableHead className="sticky right-0 bg-card">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={row.docId || rowIndex}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Input
                        type="text"
                        value={row[col.id]}
                        onChange={(e) => handleInputChange(rowIndex, col.id, e.target.value)}
                        className="w-48"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 bg-card">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow(rowIndex)}
                      aria-label="Delete row"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            No data here. Click "Add Row" to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
