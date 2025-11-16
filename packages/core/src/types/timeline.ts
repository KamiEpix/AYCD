/**
 * Timeline-related types
 */

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: number | string; // Unix timestamp or custom date format
  duration?: number; // In seconds
  documentId?: string;
  tags?: string[];
  color?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  events: TimelineEvent[];
  color?: string;
  visible?: boolean;
}

export interface TimelineData {
  tracks: TimelineTrack[];
  startDate?: number;
  endDate?: number;
  scale?: 'day' | 'week' | 'month' | 'year' | 'custom';
}
