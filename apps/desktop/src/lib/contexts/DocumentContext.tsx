import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Document, DocumentType } from '@aycd/core';
import * as documentApi from '@/lib/api/documents';

interface DocumentContextValue {
  // State
  current: Document | null;
  documents: Document[];
  filteredDocuments: Document[];
  mode: DocumentType;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDocuments: (projectPath: string) => Promise<void>;
  createDocument: (
    projectPath: string,
    title: string,
    documentType: DocumentType,
    category: string,
    subcategory?: string
  ) => Promise<Document>;
  openDocument: (documentPath: string) => Promise<Document>;
  saveCurrentDocument: (content: string) => Promise<void>;
  deleteDocument: (documentPath: string) => Promise<void>;
  closeDocument: () => void;
  setMode: (mode: DocumentType) => void;
  clearDocuments: () => void;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentMode, setCurrentMode] = useState<DocumentType>('world');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed: Filter documents by mode
  const filteredDocuments = useMemo(() => {
    return documents.filter(d => d.documentType === currentMode);
  }, [documents, currentMode]);

  const loadDocuments = useCallback(async (projectPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await documentApi.listAllDocuments(projectPath);
      setDocuments(result);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to load documents:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDocument = useCallback(async (
    projectPath: string,
    title: string,
    documentType: DocumentType,
    category: string,
    subcategory?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const document = await documentApi.createDocument({
        projectId: projectPath,
        title,
        documentType,
        category,
        subcategory,
      });
      setDocuments(prev => [document, ...prev]);
      setCurrentDocument(document);
      return document;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to create document:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openDocument = useCallback(async (documentPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const document = await documentApi.readDocument(documentPath);
      setCurrentDocument(document);
      return document;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to open document:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCurrentDocument = useCallback(async (content: string) => {
    if (!currentDocument) {
      throw new Error('No document is currently open');
    }

    try {
      await documentApi.updateDocument({
        id: currentDocument.path, // Using path as id for now
        content,
      });

      // Update local state
      const updatedDoc = { ...currentDocument, content };
      setCurrentDocument(updatedDoc);

      // Update in documents list
      setDocuments(prev => {
        const index = prev.findIndex(d => d.path === currentDocument.path);
        if (index !== -1) {
          const newDocs = [...prev];
          newDocs[index] = updatedDoc;
          return newDocs;
        }
        return prev;
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to save document:', e);
      throw e;
    }
  }, [currentDocument]);

  const deleteDocument = useCallback(async (documentPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await documentApi.deleteDocument(documentPath);

      // Remove from documents list
      setDocuments(prev => prev.filter(d => d.path !== documentPath));

      // Close if it was the current document
      if (currentDocument?.path === documentPath) {
        setCurrentDocument(null);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(errorMsg);
      console.error('Failed to delete document:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [currentDocument]);

  const closeDocument = useCallback(() => {
    setCurrentDocument(null);
  }, []);

  const setMode = useCallback((mode: DocumentType) => {
    setCurrentMode(mode);
    // Close current document when switching modes
    setCurrentDocument(null);
  }, []);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
    setCurrentDocument(null);
    setError(null);
  }, []);

  const value: DocumentContextValue = {
    current: currentDocument,
    documents,
    filteredDocuments,
    mode: currentMode,
    isLoading,
    error,
    loadDocuments,
    createDocument,
    openDocument,
    saveCurrentDocument,
    deleteDocument,
    closeDocument,
    setMode,
    clearDocuments,
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
