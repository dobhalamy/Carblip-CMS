import { cmsUserLogsReducer } from './cmsuserlogs.reducers';
import { name } from './cmsuserlogs.selectors';

export const store = {
  name,
  cmsUserLogsReducer: cmsUserLogsReducer,
  config: {},
};
