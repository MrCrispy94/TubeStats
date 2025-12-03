export interface VideoEntry {
  title: string;
  url: string;
  channel: string;
  channelUrl: string;
  date: Date;
  id: string; // Extracted from URL
}

export interface WatchStats {
  totalVideos: number;
  uniqueVideos: number;
  topChannels: { name: string; count: number }[];
  topVideos: { title: string; url: string; count: number; channel: string }[];
  firstDate: Date | null;
  lastDate: Date | null;
  estimatedMinutesDeterministic: number; // calculated from time-between-watches
}

export type TimeGranularity = 'day' | 'month' | 'year';

export interface ChartDataPoint {
  name: string;
  count: number;
  dateValue: number; // for sorting
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}