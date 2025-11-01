export type NoteHistoryEntry = {
  note: string;
  timestamp: string;
};

export type BusinessData = {
  docId: string;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  instagramUrl: string;
  instagramPresent: string;
  notes: string;
  noteHistory?: NoteHistoryEntry[];
};
