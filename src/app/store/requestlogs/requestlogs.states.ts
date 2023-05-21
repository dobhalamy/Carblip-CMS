import * as commonModels from 'app/shared/models/common.model';
import * as logModels from 'app/shared/models/log.model';

export interface RequestLogsState {
  fetching: boolean;
  didFetch: boolean;
  data: Array<logModels.Log>;
  filter: logModels.Filter;
  meta: commonModels.Meta;
}

export const initialState: RequestLogsState = {
  fetching: false,
  didFetch: false,
  data: [],
  filter: {
    search: '',
    page: 1,
    per_page: 10,
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 0,
    path: '',
    per_page: 0,
    to: 0,
    total: 0,
  },
};
