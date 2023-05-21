import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';

import { MatSnackBar } from '@angular/material';
import { CMSUSER } from 'app/core/errors';
import { formatErrorMessage } from 'app/shared/helpers/api.helper';
import {
  CmsUser,
  CmsUserResponse,
  UpdateCmsUser,
} from 'app/shared/models/cmsuser.model';
import * as commonModels from 'app/shared/models/common.model';
import * as logActions from 'app/store/cmsuserlogs/cmsuserlogs.actions';
import { initialState as initialLogState } from 'app/store/cmsuserlogs/cmsuserlogs.states';
import { AddError } from 'app/store/error/error.actions';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AppState } from '..';
import { CmsUserService } from '../../shared/services/apis/cmsusers.service';
import * as actions from './cmsusers.actions';

@Injectable()
export class CmsUserEffects {
  @Effect()
  getList$: Observable<Action> = this.actions$.pipe(
    ofType(actions.GET_LIST),
    map(action => (action as actions.GetList).payload),
    switchMap(payload => {
      return from(this.service$.getList(payload)).pipe(
        map(result => {
          return new actions.GetListSuccess(result);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: CMSUSER.TYPE,
              message: formatErrorMessage(err, CMSUSER.LIST_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: CMSUSER.LIST_ERROR,
            })
          );
        })
      );
    })
  );

  @Effect()
  create$: Observable<Action> = this.actions$.pipe(
    ofType(actions.CREATE),
    map(action => (action as actions.Create).payload),
    switchMap(payload => {
      return from(this.service$.create(payload)).pipe(
        map(result => {
          this.snack$.open('CMS User Added!', 'OK', {
            duration: 4000,
          });
          return new actions.CreateSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: CMSUSER.TYPE,
              message: formatErrorMessage(err, CMSUSER.ADD_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: CMSUSER.ADD_ERROR,
            })
          );
        })
      );
    })
  );

  @Effect()
  edit$: Observable<Action> = this.actions$.pipe(
    ofType(actions.UPDATE),
    map(action => (action as actions.Update).payload),
    switchMap(payload => {
      return from(this.service$.update(payload.id, payload.data)).pipe(
        map(result => {
          this.snack$.open('CMS User Edited!', 'OK', {
            duration: 4000,
          });
          return new actions.UpdateSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: CMSUSER.TYPE,
              message: formatErrorMessage(err, CMSUSER.EDIT_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: CMSUSER.EDIT_ERROR,
            })
          );
        })
      );
    })
  );

  @Effect()
  updateRR$: Observable<Action> = this.actions$.pipe(
    ofType(actions.UPDATERR),
    map(action => (action as actions.UpdateRR).payload),
    switchMap(payload => {
      return from(this.service$.updateRR(payload.id, payload.status)).pipe(
        map(result => {
          this.snack$.open('CMS User Updated!', 'OK', {
            duration: 4000,
          });
          return new actions.UpdateRRSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: CMSUSER.TYPE,
              message: formatErrorMessage(err, CMSUSER.EDIT_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: CMSUSER.EDIT_ERROR,
            })
          );
        })
      );
    })
  );

  @Effect()
  toggle$: Observable<Action> = this.actions$.pipe(
    ofType(actions.TOGGLE),
    map(action => (action as actions.Update).payload),
    switchMap(payload => {
      return from(this.service$.toggle(payload.id, payload.data)).pipe(
        map(result => {
          this.snack$.open('CMS User Updated!', 'OK', {
            duration: 4000,
          });
          return new actions.UpdateSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: CMSUSER.TYPE,
              message: formatErrorMessage(err, CMSUSER.EDIT_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: CMSUSER.EDIT_ERROR,
            })
          );
        })
      );
    })
  );

  @Effect()
  delete$: Observable<Action> = this.actions$.pipe(
    ofType(actions.DELETE),
    map(action => (action as actions.Delete).payload),
    switchMap(payload => {
      return from(this.service$.delete(payload.id)).pipe(
        map(result => {
          this.snack$.open('CMS User Deleted!', 'OK', {
            duration: 4000,
          });
          this.store$.dispatch(new logActions.GetList(initialLogState.filter));
          return new actions.DeleteSuccess();
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: CMSUSER.TYPE,
              message: CMSUSER.DELETE_ERROR,
            })
          );
          return of(
            new actions.AddError({
              error: CMSUSER.DELETE_ERROR,
            })
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private service$: CmsUserService,
    private snack$: MatSnackBar,
    private store$: Store<AppState>
  ) {}
}
