import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CmsUsersState } from './cmsusers.states';

export const name = 'cmsusers';
export const cmsUsersSelector = createFeatureSelector<CmsUsersState>(name);

export const didFetchSelector = createSelector(
  cmsUsersSelector,
  (state: CmsUsersState) => state.didFetch
);

export const fetchingSelector = createSelector(
  cmsUsersSelector,
  (state: CmsUsersState) => state.fetching
);

export const processingSelector = createSelector(
  cmsUsersSelector,
  (state: CmsUsersState) => state.processing
);

export const dataSelector = createSelector(
  cmsUsersSelector,
  (state: CmsUsersState) => state.data
);

export const filterSelector = createSelector(
  cmsUsersSelector,
  (state: CmsUsersState) => state.filter
);

export const metaSelector = createSelector(
  cmsUsersSelector,
  (state: CmsUsersState) => state.meta
);
