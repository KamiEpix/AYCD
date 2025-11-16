/**
 * Document-related types
 */

export type DocumentType = 'world' | 'narrative';

export interface Document {
  id: string;
  projectId: string;
  path: string;
  title: string;
  content: string;
  documentType: DocumentType; // WORLD vs NARRATIVE mode
  wordCount: number;
  createdAt: number;
  modifiedAt: number;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  tags?: string[];
  status?: 'draft' | 'review' | 'final';
  category?: string; // e.g., 'Cast', 'Places', 'Drafts', 'Final'
  subcategory?: string;
}

export interface CreateDocumentInput {
  projectId: string;
  title: string;
  documentType: DocumentType; // Required: WORLD or NARRATIVE
  category: string;
  subcategory?: string;
}

export interface UpdateDocumentInput {
  id: string;
  title?: string;
  content?: string;
  metadata?: Partial<DocumentMetadata>;
}
