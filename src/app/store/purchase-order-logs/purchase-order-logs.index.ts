import { purchaseOrderLogReducer } from './purchase-order-logs.reducers';
import { name } from './purchase-order-logs.selectors';

export const store = {
  name,
  purchaseOrderLogReducer: purchaseOrderLogReducer,
  config: {},
};
