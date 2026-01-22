export type ZoteroItemValues = Record<string, any> & { version?: number };

export type ZoteroLocalItem = {
  key: string;
  data: Record<string, any>;
  meta?: Record<string, any>;
};

export type PdfAttachment = {
  key: string;
  filePath?: string;
};

export type NoteMetadataFields = {
  title: string;
  short_title: string;
  date: string;
  abstract: string;
  tags: string[];
  authors: string[];
  editors: string[];
};

export type MetadataDecision = "note" | "zotero" | "skip";

export type DocIndexEntry = {
  doc_id: string;
  note_path: string;
  note_title: string;
  zotero_title?: string;
  short_title?: string;
  pdf_path?: string;
  attachment_key?: string;
  updated_at: string;
};
