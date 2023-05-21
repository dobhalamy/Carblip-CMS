import { Action } from '@ngrx/store';

import * as commonModels from 'app/shared/models/common.model';

import { CarsDirect, CarsDirectResponse } from 'app/shared/models/cars-direct.model';

//#region Get List
export const GET_LIST = '@lc/carsdirect/get-list';
export class GetList implements Action {
  readonly type = GET_LIST;
  constructor() {}
}
//#endregion

//#region Get List Success
export const GET_LIST_SUCCESS = '@lc/carsdirect/get-list-success';

export class GetListSuccess implements Action {
  readonly type = GET_LIST_SUCCESS;
  constructor(public payload: CarsDirectResponse) {}
}
//#endregion

//#region Update Filter
export const UPDATE_FILTER = '@lc/carsdirect/update-filter';

export class UpdateFilter implements Action {
  readonly type = UPDATE_FILTER;
  constructor(public payload: object) {}
}
//#endregion

//#region Update Meta
export const UPDATE_META = '@lc/carsdirect/update-meta';

export class UpdateMeta implements Action {
  readonly type = UPDATE_META;
  constructor(public payload: object) {}
}
//#endregion

//#region Create
// export const CREATE = '@lc/carsdirect/create';

// export class Create implements Action {
//   readonly type = CREATE;
//   constructor(public payload: object) {}
// }

// export const CREATE_SUCCESS = '@lc/object/create-success';

// export class CreateSuccess implements Action {
//   readonly type = CREATE_SUCCESS;
//   constructor(public payload: Request) {}
// }
//#endregion

//#region Delete
export const DELETE = '@lc/carsdirect/delete';
export interface DeletePayload {
  id: number;
}
export class Delete implements Action {
  readonly type = DELETE;
  constructor(public payload: DeletePayload) {}
}

export const DELETE_SUCCESS = '@lc/carsdirect/delete-success';
export class DeleteSuccess implements Action {
  readonly type = DELETE_SUCCESS;
  constructor() {}
}
//#endregion

//#region Add Error
export const ADD_ERROR = '@lc/carsdirect/add-error';
export interface AddErrorPayload {
  error: string;
}
export class AddError implements Action {
  readonly type = ADD_ERROR;
  constructor(public payload: AddErrorPayload) {}
}
//#endregion

//#region Clear Detail
export const CLEAR_DETAIL = '@lc/requests/clear-detail';
export class ClearDetail implements Action {
  readonly type = CLEAR_DETAIL;
  constructor() {}
}
//#endregion

export type Actions =
  | GetList
  | GetListSuccess
  | UpdateFilter
  | UpdateMeta
  | Delete
  | DeleteSuccess
  | AddError
  | ClearDetail;
