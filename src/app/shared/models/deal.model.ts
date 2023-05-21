import { Link, Meta, Pagination } from './common.model';

export interface DealStage {
  id: number;
  name: string;
  captive?: string;
  is_domestic?: number;
  is_new?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DealStageResponse {
  data: Array<DealStage>;
  links: Link;
  meta: Meta;
}
