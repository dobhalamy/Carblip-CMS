import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PurchaseOrderLogState } from './purchase-order-logs.states';

export const name = 'purchaseorderlog';
export const quotesSelector = createFeatureSelector<PurchaseOrderLogState>(name);

export const didFetchSelector = createSelector(
  quotesSelector,
  (state: PurchaseOrderLogState) => state.didFetch
);

export const fetchingSelector = createSelector(
  quotesSelector,
  (state: PurchaseOrderLogState) => state.fetching
);

export const processingSelector = createSelector(
  quotesSelector,
  (state: PurchaseOrderLogState) => state.processing
);

export const dataSelector = createSelector(
  quotesSelector,
  (state: PurchaseOrderLogState) => state.data
);

export const filterSelector = createSelector(
  quotesSelector,
  (state: PurchaseOrderLogState) => state.filter
);

export const metaSelector = createSelector(
  quotesSelector,
  (state: PurchaseOrderLogState) => state.meta
);
