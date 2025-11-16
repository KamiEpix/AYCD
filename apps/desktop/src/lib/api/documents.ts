/**
 * Document management API
 * Communicates with Rust backend via Tauri IPC
 */

import { invoke } from '@tauri-apps/api/core';
import type { Document, CreateDocumentInput, UpdateDocumentInput } from '@aycd/core';

/**
 * Creates a new document
 */
export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  return await invoke<Document>('create_document', {
    projectPath: input.projectId, // projectId is actually the path in our case
    title: input.title,
    category: input.category,
    subcategory: input.subcategory,
  });
}

/**
 * Reads a document's content
 */
export async function readDocument(documentPath: string): Promise<Document> {
  return await invoke<Document>('read_document', { documentPath });
}

/**
 * Updates a document's content
 */
export async function updateDocument(input: UpdateDocumentInput): Promise<void> {
  // We need the path from the document
  const documentPath = input.id; // For now, using id as path
  await invoke('update_document', {
    documentPath,
    content: input.content,
  });
}

/**
 * Deletes a document
 */
export async function deleteDocument(documentPath: string): Promise<void> {
  await invoke('delete_document', { documentPath });
}

/**
 * Lists all documents in a specific directory
 */
export async function listDocumentsInDir(dirPath: string): Promise<Document[]> {
  return await invoke<Document[]>('list_documents_in_dir', { dirPath });
}

/**
 * Lists all documents in a project
 */
export async function listAllDocuments(projectPath: string): Promise<Document[]> {
  return await invoke<Document[]>('list_all_documents', { projectPath });
}
