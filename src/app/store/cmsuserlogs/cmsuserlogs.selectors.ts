import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CmsUserLogsState } from './cmsuserlogs.states';

export const name = 'cmsuserlogs';
export const cmsUserogsSelector = createFeatureSelector<CmsUserLogsState>(name);

export const didFetchSelector = createSelector(
  cmsUserogsSelector,
  (state: CmsUserLogsState) => state.didFetch
);

export const fetchingSelector = createSelector(
  cmsUserogsSelector,
  (state: CmsUserLogsState) => state.fetching
);

export const dataSelector = createSelector(
  cmsUserogsSelector,
  (state: CmsUserLogsState) => state.data
);

export const filterSelector = createSelector(
  cmsUserogsSelector,
  (state: CmsUserLogsState) => state.filter
);

export const metaSelector = createSelector(
  cmsUserogsSelector,
  (state: CmsUserLogsState) => state.meta
);
