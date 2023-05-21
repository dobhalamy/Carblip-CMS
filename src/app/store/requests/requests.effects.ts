import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';

import { MatSnackBar } from '@angular/material';
import { REQUEST } from 'app/core/errors';
import { formatErrorMessage } from 'app/shared/helpers/api.helper';
import * as commonModels from 'app/shared/models/common.model';
import { Request, RequestResponse } from 'app/shared/models/request.model';
import { AddError } from 'app/store/error/error.actions';
import * as logActions from 'app/store/requestlogs/requestlogs.actions';
import { initialState as initialLogState } from 'app/store/requestlogs/requestlogs.states';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AppState } from '..';
import { RequestService } from '../../shared/services/apis/requests.service';
import * as actions from './requests.actions';

@Injectable()
export class RequestEffects {
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
              type: REQUEST.TYPE,
              message: formatErrorMessage(err, REQUEST.LIST_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: REQUEST.LIST_ERROR,
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
          this.snack$.open('Request successfully Deleted!', 'OK', {
            duration: 4000,
          });
          this.store$.dispatch(new logActions.GetList(initialLogState.filter));
          return new actions.DeleteSuccess();
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: REQUEST.TYPE,
              message: REQUEST.DELETE_ERROR,
            })
          );
          return of(
            new actions.AddError({
              error: REQUEST.DELETE_ERROR,
            })
          );
        })
      );
    })
  );

  @Effect()
  getYears$: Observable<Action> = this.actions$.pipe(
    ofType(actions.GET_LIST),
    map(action => (action as actions.GetYears)),
    switchMap(payload => {
      return from(this.service$.getYears()).pipe(
        map(result => {
          return new actions.GetListYears(result);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: REQUEST.TYPE,
              message: formatErrorMessage(err, REQUEST.LIST_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: REQUEST.LIST_ERROR,
            })
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private service$: RequestService,
    private snack$: MatSnackBar,
    private store$: Store<AppState>
  ) {}
}
