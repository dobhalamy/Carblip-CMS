import { Action } from '@ngrx/store';
import { PurchaseOrderResponse } from 'app/shared/models/purchase-order.model';

//#region Get List
export const GET_LIST = '@lc/purchase-order/get-list';
export class GetList implements Action {
  readonly type = GET_LIST;
  constructor() { }
}
//#endregion

//#region Get List Success
export const GET_LIST_SUCCESS = '@lc/purchase-order/get-list-success';

export class GetListSuccess implements Action {
  readonly type = GET_LIST_SUCCESS;
  constructor(public payload: PurchaseOrderResponse) { }
}
//#endregion

//#region Get History List
export const GET_HISTORY_LIST = '@lc/purchase-order/get-history-list';
export class GetHistoryList implements Action {
  readonly type = GET_HISTORY_LIST;
  constructor() { }
}
//#endregion



export type Actions =
  | GetList
  | GetHistoryList
  | GetListSuccess

