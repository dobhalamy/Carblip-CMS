import { Link, Meta, Pagination } from './common.model';
import { Location } from './location.model';
import { Log } from './log.model';

/**
 * User Permission Interface
 */
export interface Permission {
  id: number;
  name: string;
}

/**
 * User Role Interface
 */
export interface Role {
  id: number;
  name: string;
}

/**
 * CmsUser Interface for post, put request
 */
export interface UpdateCmsUser {
  name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  role_id?: number;
  location_id?: number;
  promo_code?:string;
  roundrobin?: boolean;
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
}

/**
 * CmsUser Interface
 */
export interface CmsUser {
  id?: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  roles?: Array<Role>;
  permissions?: Array<Permission>;
  location: Location;
  promo_code:string;
  email: string;
  password?: string;
  roundrobin?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * CmsUser Response Interface
 */
export interface CmsUserResponse {
  data: Array<CmsUser>;
  links: Link;
  meta: Meta;
}

export interface RequestFilter {
  roles?: string;
  isactive?: string;
  isinactive?: string;
  isroundrobin?: string;
}

export interface Filter {
  search?: string;
  filter?: RequestFilter;
  order_by?: string;
  order_dir?: string;
  page: number;
  per_page: number;
}
