import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';

import { MatSnackBar } from '@angular/material';
import { USER } from 'app/core/errors';
import { formatErrorMessage } from 'app/shared/helpers/api.helper';
import * as commonModels from 'app/shared/models/common.model';
import { User, UserResponse } from 'app/shared/models/user.model';
import { AddError } from 'app/store/error/error.actions';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AppState } from '..';
import { UserService } from '../../shared/services/apis/users.service';
import * as actions from './users.actions';
import * as logActions from 'app/store/userlogs/userlogs.actions';
import { initialState as initialLogState } from 'app/store/userlogs/userlogs.states';

@Injectable()
export class UserEffects {
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
              type: USER.TYPE,
              message: formatErrorMessage(err, USER.LIST_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: USER.LIST_ERROR,
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
          this.snack$.open('User Added!', 'OK', {
            duration: 4000,
          });
          return new actions.CreateSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: USER.TYPE,
              message: formatErrorMessage(err, USER.ADD_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: USER.ADD_ERROR,
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
          this.snack$.open('User Edited!', 'OK', {
            duration: 4000,
          });
          return new actions.UpdateSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: USER.TYPE,
              message: formatErrorMessage(err, USER.EDIT_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: USER.EDIT_ERROR,
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
          this.snack$.open('User Edited!', 'OK', {
            duration: 4000,
          });
          return new actions.UpdateSuccess(result.data);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: USER.TYPE,
              message: formatErrorMessage(err, USER.EDIT_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: USER.EDIT_ERROR,
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
          this.snack$.open('User Deleted!', 'OK', {
            duration: 4000,
          });
          this.store$.dispatch(new logActions.GetList(initialLogState.filter));
          return new actions.DeleteSuccess();
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: USER.TYPE,
              message: USER.DELETE_ERROR,
            })
          );
          return of(
            new actions.AddError({
              error: USER.DELETE_ERROR,
            })
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private service$: UserService,
    private snack$: MatSnackBar,
    private store$: Store<AppState>
  ) {}
}
