import { initialState, PurchaseOrderLogState } from './purchase-order-logs.states';
import * as actions from './purchase-order-logs.actions';

export function purchaseOrderLogReducer(
  state: PurchaseOrderLogState = initialState,
  action: actions.Actions
): PurchaseOrderLogState {
  switch (action.type) {
    /* Get List */
    case actions.GET_LIST:
      return {
        ...state,
        didFetch: false,
        fetching: true,
        data: [],
      };
    /* Get History List */
    case actions.GET_HISTORY_LIST:
      return {
        ...state,
        didFetch: false,
        fetching: true,
        data: []
      };

    default:
      return state;
  }
}
