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
import { PlusCircle, Trash2, Save, Loader2, FileText, Clock, Search } from 'lucide-react';

const columns: { id: keyof Omit<BusinessData, 'docId' | 'notes' | 'noteHistory'>; label: string }[] = [
    { id: 'businessName', label: 'Business Name' },
    { id: 'address', label: 'Address' },
    { id: 'phone', label: 'Phone' },
    { id: 'website', label: 'Website' },
    { id: 'google', label: 'Google' },
    { id: 'instagramUrl', label: 'Instagram URL' },
    { id: 'instagramPresent', label: 'Instagram Present' },
];

export default function SpreadsheetTable({ initialData }: { initialData: BusinessData[] }) {
  const [data, setData] = useState<BusinessData[]>(initialData);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [editingNote, setEditingNote] = useState<{ rowIndex: number; notes: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleInputChange = (rowIndex: number, columnId: keyof Omit<BusinessData, 'docId' | 'notes'>, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
    setData(newData);
  };
  
  const handleSaveNote = () => {
    if (editingNote) {
      const newData = [...data];
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      // Add to note history
      const noteHistoryEntry = {
        note: editingNote.notes,
        timestamp: timestamp,
      };
      
      const existingHistory = newData[editingNote.rowIndex].noteHistory || [];
      newData[editingNote.rowIndex].notes = editingNote.notes;
      newData[editingNote.rowIndex].noteHistory = [...existingHistory, noteHistoryEntry];
      
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
      google: '',
      instagramUrl: '',
      instagramPresent: '',
      notes: '',
      noteHistory: [],
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
      // Sort data alphabetically by business name before saving
      const sortedData = [...data].sort((a, b) => {
        const nameA = (a.businessName || '').toLowerCase();
        const nameB = (b.businessName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      const result = await saveSpreadsheetData(sortedData);
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

  // Filter data based on search query
  const filteredData = data.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return row.businessName?.toLowerCase().includes(query);
  });

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <CardTitle>Business Information</CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full md:w-[300px]"
            />
          </div>
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
                <TableHead className="sticky left-0 bg-card z-10 w-12 text-center">#</TableHead>
                <TableHead className="sticky left-12 bg-card z-10">Notes</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.id} className="whitespace-nowrap">{col.label}</TableHead>
                ))}
                {/* <TableHead className="sticky right-0 bg-card">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? `No businesses found matching "${searchQuery}"` : 'No data available. Click "Add Row" to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, rowIndex) => {
                  // Get the original index for editing
                  const originalIndex = data.findIndex(d => d.docId === row.docId || (d === row));
                  return (
                <TableRow key={row.docId || originalIndex}>
                  <TableCell className="sticky left-0 bg-card z-10 text-center">
                    <span className="text-xs text-muted-foreground/60 font-mono">{rowIndex + 1}</span>
                  </TableCell>
                  <TableCell className="sticky left-12 bg-card z-10">
                     <Dialog onOpenChange={(open) => !open && setEditingNote(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingNote({ rowIndex: originalIndex, notes: row.notes || '' })}
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
                          <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-medium">
                              Notes
                            </label>
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
                          
                          {/* Note History */}
                          {row.noteHistory && row.noteHistory.length > 0 && (
                            <div className="space-y-2 border-t pt-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Note History</span>
                              </div>
                              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                {[...row.noteHistory].reverse().map((entry, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-lg border bg-muted/50 p-3 space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {entry.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                      {entry.note}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                        onChange={(e) => handleInputChange(originalIndex, col.id, e.target.value)}
                        className="w-48"
                      />
                    </TableCell>
                  ))}
                  {/* <TableCell className="sticky right-0 bg-card">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow(rowIndex)}
                      aria-label="Delete row"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell> */}
                </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
