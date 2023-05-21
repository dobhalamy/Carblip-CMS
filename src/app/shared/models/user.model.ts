import { Permission, Role } from './cmsuser.model';
import { CmsUser } from './cmsuser.model';
import { Link, Meta, Pagination } from './common.model';
import { Location } from './location.model';
import { Request } from './request.model';


/**
 * User list filters 
 */
 export interface RequestFilter {
  start_date?: string;
  end_date?: string;
  first_name?: string;
  last_name?: string;
  phone?: number;
  source?: string;
  created_by?: number;
  contact_owner?: number;
}

export interface Filter {
  search?: string;
  filter?: RequestFilter;
  order_by?: string;
  order_dir?: string;
  page: number;
  per_page: number;
}

/**
 * User Profile Interface
 */
export interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  location: Location;
  permissions: Array<Permission>;
  roles: Array<Role>;
  created_at: string;
  updated_at: string;
}

/**
 * User Interface for post, update request
 */
export interface UpdateProfile {
  first_name?: string;
  last_name?: string;
  password?: string;
  password_confirmation?: string;
}

/**
 * User Interface for post, update request
 */
export interface UpdateUser {
  name: string;
  first_name: string;
  last_name: string;
  contact_owner_email?: string;
  password?: string;
  password_confirmation?: string;
}

/**
 * User Interface
 */
export interface User {
  id?: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email_address: string;
  contact_owner?: string;
  contact_owner_email?: string;
  password?: string;
  phone?: string;
  phone_verified?: number;
  app_version?: string;
  device_type?: string;
  lease_captured?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  cms_user?: CmsUser;
  requests?: Array<Request>;
  phone_preferred_contact?: number;
  phone_preferred_time?: string;
  phone_preferred_type?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source?: string | number;
}

/**
 * Authenticated User Response Interface
 */
export interface AuthUserResonse {
  data: Profile;
}

/**
 * User List Response Interface
 */
export interface UserResponse {
  data: Array<User>;
  links: Link;
  meta: Meta;
}
