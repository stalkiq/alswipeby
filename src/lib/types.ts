export type NoteHistoryEntry = {
  note: string;
  timestamp: string;
};

export type ContactStage = 
  | 'New Lead'
  | 'Walked In'
  | 'Initial Contact'
  | 'Spoke with Owner'
  | 'Demo Scheduled'
  | 'Demo Completed'
  | 'Follow-up'
  | 'Closed/Won'
  | 'Not Interested';

export type BusinessData = {
  docId: string;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  google: string;
  instagramUrl: string;
  notes: string;
  contactStage: ContactStage;
  noteHistory?: NoteHistoryEntry[];
};
