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
      <CardHeader className="flex flex-col gap-3 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl md:text-2xl">Business Information</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={addRow} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            <Button onClick={handleSave} disabled={isPending} variant="default" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 sm:flex-none">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="text-xs text-muted-foreground px-4 py-2 bg-muted/50 sm:hidden">
          👈 Swipe left to see more columns
        </div>
        <div className="relative w-full overflow-x-auto rounded-md border-t sm:border">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 w-10 sm:w-12 text-center text-xs sm:text-sm">#</TableHead>
                <TableHead className="sticky left-10 sm:left-12 bg-card z-10 min-w-[60px] text-xs sm:text-sm">Notes</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.id} className="whitespace-nowrap min-w-[140px] sm:min-w-[180px] text-xs sm:text-sm">{col.label}</TableHead>
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
                  <TableCell className="sticky left-0 bg-card z-10 text-center p-2 sm:p-4">
                    <span className="text-[10px] sm:text-xs text-muted-foreground/60 font-mono">{rowIndex + 1}</span>
                  </TableCell>
                  <TableCell className="sticky left-10 sm:left-12 bg-card z-10 p-2 sm:p-4">
                     <Dialog onOpenChange={(open) => !open && setEditingNote(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingNote({ rowIndex: originalIndex, notes: row.notes || '' })}
                        >
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg">Edit Notes</DialogTitle>
                          <DialogDescription className="text-sm">
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
                    <TableCell key={col.id} className="p-2 sm:p-4">
                      <Input
                        type="text"
                        value={row[col.id]}
                        onChange={(e) => handleInputChange(originalIndex, col.id, e.target.value)}
                        className="w-32 sm:w-48 text-sm"
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
