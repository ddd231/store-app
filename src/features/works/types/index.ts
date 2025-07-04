// Works Feature Types
import { Work, QueryFilters } from '../../../shared/types/common';

export interface WorksQueryFilters extends QueryFilters {
  type?: 'painting' | 'novel';
  sort_by?: 'latest' | 'oldest' | 'random';
}

export interface CreateWorkRequest {
  title: string;
  content?: string;
  description?: string;
  image_url?: string;
  type: 'painting' | 'novel';
  category?: string;
  is_public: boolean;
}

export interface UpdateWorkRequest {
  title?: string;
  content?: string;
  description?: string;
  image_url?: string;
  category?: string;
  is_public?: boolean;
}

export interface WorkCardProps {
  work: Work;
  onPress: (work: Work) => void;
  style?: any;
}

export interface WorksListProps {
  works: Work[];
  loading?: boolean;
  onRefresh?: () => void;
  onWorkPress: (work: Work) => void;
}

export interface WorkUploadData {
  file: {
    uri: string;
    name: string;
    type: string;
  };
  metadata: CreateWorkRequest;
}