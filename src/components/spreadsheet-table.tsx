"use client";

import { useState } from 'react';
import type { BusinessData } from '@/lib/types';
import { saveSpreadsheetData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, Loader2, FileText } from 'lucide-react';

const columns: { id: keyof Omit<BusinessData, 'docId' | 'notes'>; label: string }[] = [
    { id: 'businessName', label: 'Business Name' },
    { id: 'address', label: 'Address' },
    { id: 'phone', label: 'Phone' },
    { id: 'website', label: 'Website' },
    { id: 'instagramUrl', label: 'Instagram URL' },
    { id: 'instagramPresent', label: 'Instagram Present' },
];

export default function SpreadsheetTable({ initialData }: { initialData: BusinessData[] }) {
  const [data, setData] = useState<BusinessData[]>(initialData);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [editingNote, setEditingNote] = useState<{ rowIndex: number; notes: string } | null>(null);

  const handleInputChange = (rowIndex: number, columnId: keyof Omit<BusinessData, 'docId' | 'notes'>, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
    setData(newData);
  };
  
  const handleSaveNote = () => {
    if (editingNote) {
      const newData = [...data];
      newData[editingNote.rowIndex].notes = editingNote.notes;
      setData(newData);
      setEditingNote(null);
    }
  };

  const addRow = () => {
    const newRow: BusinessData = {
      docId: '', // Will be generated on save
      businessName: '',
      address: '',
      phone: '',
      website: '',
      instagramUrl: '',
      instagramPresent: '',
      notes: '',
    };
    setData([...data, newRow]);
  };

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    setData(newData);
  };

  const handleSave = async () => {
    setIsPending(true);
    try {
      const result = await saveSpreadsheetData(data);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        // Reload the page after 1 second to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save data',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Business Information</CardTitle>
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
                <TableHead className="sticky left-0 bg-card z-10">Notes</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>
                ))}
                <TableHead className="sticky right-0 bg-card">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={row.docId || rowIndex}>
                  <TableCell className="sticky left-0 bg-card z-10">
                     <Dialog onOpenChange={(open) => !open && setEditingNote(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingNote({ rowIndex, notes: row.notes || '' })}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Notes</DialogTitle>
                          <DialogDescription>
                            Add or edit notes for {row.businessName || 'this business'}. Click save when you're done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Textarea
                            id="notes"
                            value={editingNote?.notes || ''}
                            onChange={(e) =>
                              editingNote && setEditingNote({ ...editingNote, notes: e.target.value })
                            }
                            className="col-span-3 min-h-[150px]"
                             placeholder="Type your notes here."
                          />
                        </div>
                        <DialogFooter>
                           <DialogClose asChild>
                            <Button type="button" variant="secondary">
                              Cancel
                            </Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleSaveNote();
                              }}
                            >
                              Save changes
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
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
