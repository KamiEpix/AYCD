/**
 * Document-related types
 */

export interface Document {
  id: string;
  projectId: string;
  path: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: number;
  modifiedAt: number;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  tags?: string[];
  status?: 'draft' | 'review' | 'final';
  category?: 'world' | 'narrative' | 'planning' | 'research';
  subcategory?: string;
}

export interface CreateDocumentInput {
  projectId: string;
  title: string;
  category: string;
  subcategory?: string;
}

export interface UpdateDocumentInput {
  id: string;
  title?: string;
  content?: string;
  metadata?: Partial<DocumentMetadata>;
}
