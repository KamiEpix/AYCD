/**
 * Document state management
 * Tracks current document and available documents in the project
 */

import type { Document } from '@aycd/core';
import * as documentApi from '$api/documents';

// Current active document
let currentDocument = $state<Document | null>(null);

// List of all documents in the project
let documents = $state<Document[]>([]);

// Loading states
let isLoading = $state(false);
let error = $state<string | null>(null);

/**
 * Loads all documents for the current project
 */
async function loadDocuments(projectPath: string) {
  isLoading = true;
  error = null;

  try {
    const result = await documentApi.listAllDocuments(projectPath);
    documents = result;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to load documents:', e);
  } finally {
    isLoading = false;
  }
}

/**
 * Creates a new document
 */
async function createDocument(
  projectPath: string,
  title: string,
  category: string,
  subcategory?: string
) {
  isLoading = true;
  error = null;

  try {
    const document = await documentApi.createDocument({
      projectId: projectPath,
      title,
      category,
      subcategory,
    });
    documents = [document, ...documents];
    currentDocument = document;
    return document;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to create document:', e);
    throw e;
  } finally {
    isLoading = false;
  }
}

/**
 * Opens a document for editing
 */
async function openDocument(documentPath: string) {
  isLoading = true;
  error = null;

  try {
    const document = await documentApi.readDocument(documentPath);
    currentDocument = document;
    return document;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to open document:', e);
    throw e;
  } finally {
    isLoading = false;
  }
}

/**
 * Saves the current document
 */
async function saveCurrentDocument(content: string) {
  if (!currentDocument) {
    throw new Error('No document is currently open');
  }

  try {
    await documentApi.updateDocument({
      id: currentDocument.path, // Using path as id for now
      content,
    });

    // Update local state
    currentDocument = { ...currentDocument, content };

    // Update in documents list
    const index = documents.findIndex((d) => d.path === currentDocument!.path);
    if (index !== -1) {
      documents[index] = currentDocument;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to save document:', e);
    throw e;
  }
}

/**
 * Deletes a document
 */
async function deleteDocument(documentPath: string) {
  isLoading = true;
  error = null;

  try {
    await documentApi.deleteDocument(documentPath);

    // Remove from documents list
    documents = documents.filter((d) => d.path !== documentPath);

    // Close if it was the current document
    if (currentDocument?.path === documentPath) {
      currentDocument = null;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error('Failed to delete document:', e);
    throw e;
  } finally {
    isLoading = false;
  }
}

/**
 * Closes the current document
 */
function closeDocument() {
  currentDocument = null;
}

/**
 * Clears all documents (when closing a project)
 */
function clearDocuments() {
  documents = [];
  currentDocument = null;
  error = null;
}

// Export the store interface
export const documentStore = {
  // State (read-only getters)
  get current() {
    return currentDocument;
  },
  get documents() {
    return documents;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  // Actions
  loadDocuments,
  createDocument,
  openDocument,
  saveCurrentDocument,
  deleteDocument,
  closeDocument,
  clearDocuments,
};
