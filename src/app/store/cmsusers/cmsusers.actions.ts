import { Action } from '@ngrx/store';

import {
  CmsUser,
  CmsUserResponse,
  UpdateCmsUser,
} from 'app/shared/models/cmsuser.model';
import * as commonModels from 'app/shared/models/common.model';

//#region Get List
export const GET_LIST = '@lc/cmsusers/get-list';
export class GetList implements Action {
  readonly type = GET_LIST;
  constructor(public payload: commonModels.Filter) {}
}
//#endregion

//#region Get List Success
export const GET_LIST_SUCCESS = '@lc/cmsusers/get-list-success';

export class GetListSuccess implements Action {
  readonly type = GET_LIST_SUCCESS;
  constructor(public payload: CmsUserResponse) {}
}
//#endregion

//#region Update Filter
export const UPDATE_FILTER = '@lc/cmsusers/update-filter';

export class UpdateFilter implements Action {
  readonly type = UPDATE_FILTER;
  constructor(public payload: object) {}
}
//#endregion

//#region Update Meta
export const UPDATE_META = '@lc/cmsusers/update-meta';

export class UpdateMeta implements Action {
  readonly type = UPDATE_META;
  constructor(public payload: object) {}
}
//#endregion

//#region Create
export const CREATE = '@lc/cmsusers/create';

export class Create implements Action {
  readonly type = CREATE;
  constructor(public payload: UpdateCmsUser) {}
}

export const CREATE_SUCCESS = '@lc/cmsusers/create-success';

export class CreateSuccess implements Action {
  readonly type = CREATE_SUCCESS;
  constructor(public payload: CmsUser) {}
}
//#endregion

//#region Update
export const UPDATE = '@lc/cmsusers/update';
export interface UpdatePayload {
  id: number;
  data: UpdateCmsUser;
}
export class Update implements Action {
  readonly type = UPDATE;
  constructor(public payload: UpdatePayload) {}
}

export const UPDATE_SUCCESS = '@lc/cmsusers/update-success';

export class UpdateSuccess implements Action {
  readonly type = UPDATE_SUCCESS;
  constructor(public payload: CmsUser) {}
}
//#endregion

//#region Delete
export const DELETE = '@lc/cmsusers/delete';
export interface DeletePayload {
  id: number;
}
export class Delete implements Action {
  readonly type = DELETE;
  constructor(public payload: DeletePayload) {}
}

export const DELETE_SUCCESS = '@lc/cmsusers/delete-success';
export class DeleteSuccess implements Action {
  readonly type = DELETE_SUCCESS;
  constructor() {}
}
//#endregion

//#region UPDATE RR
export const UPDATERR = '@lc/cmsusers/update-rr';
export interface UpdateRRPayload {
  id: number;
  status: Boolean;
}
export class UpdateRR implements Action {
  readonly type = UPDATERR;
  constructor(public payload: UpdateRRPayload) {}
}

export const UPDATERR_SUCCESS = '@lc/cmsusers/update-rr-success';
export class UpdateRRSuccess implements Action {
  readonly type = UPDATERR_SUCCESS;
  constructor(public payload: CmsUser) {}
}
//#endregion

//#region Toggle
export const TOGGLE = '@lc/cmsusers/toggle';
export interface TogglePayload {
  id: number;
  data: Object;
}
export class Toggle implements Action {
  readonly type = TOGGLE;
  constructor(public payload: TogglePayload) {}
}

export const TOGGLE_SUCCESS = '@lc/cmsusers/toggle-success';

export class ToggleSuccess implements Action {
  readonly type = TOGGLE_SUCCESS;
  constructor(public payload: CmsUser) {}
}
//#endregion

//#region Add Error
export const ADD_ERROR = '@lc/cmsusers/add-error';
export interface AddErrorPayload {
  error: string;
}
export class AddError implements Action {
  readonly type = ADD_ERROR;
  constructor(public payload: AddErrorPayload) {}
}
//#endregion

//#region Clear Detail
export const CLEAR_DETAIL = '@lc/cmsusers/clear-detail';
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
  | Create
  | CreateSuccess
  | Update
  | UpdateSuccess
  | Delete
  | DeleteSuccess
  | UpdateRR
  | UpdateRRSuccess
  | Toggle
  | ToggleSuccess
  | AddError
  | ClearDetail;
