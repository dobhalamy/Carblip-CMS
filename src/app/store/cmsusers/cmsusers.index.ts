import { cmsUsersReducer } from './cmsusers.reducers';
import { name } from './cmsusers.selectors';

export const store = {
  name,
  cmsUsersReducer: cmsUsersReducer,
  config: {},
};
