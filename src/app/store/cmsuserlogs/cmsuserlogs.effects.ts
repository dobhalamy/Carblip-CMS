import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';

import { MatSnackBar } from '@angular/material';
import { CMSUSER } from 'app/core/errors';
import { formatErrorMessage } from 'app/shared/helpers/api.helper';
import * as commonModels from 'app/shared/models/common.model';
import { AddError } from 'app/store/error/error.actions';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AppState } from '..';
import { CmsUserService } from '../../shared/services/apis/cmsusers.service';
import * as actions from './cmsuserlogs.actions';

@Injectable()
export class CmsUserLogsEffects {
  @Effect()
  getList$: Observable<Action> = this.actions$.pipe(
    ofType(actions.GET_LIST),
    map(action => (action as actions.GetList).payload),
    switchMap(payload => {
      return from(this.service$.getDeleteLogs(payload)).pipe(
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

  constructor(
    private actions$: Actions,
    private service$: CmsUserService,
    private snack$: MatSnackBar,
    private store$: Store<AppState>
  ) {}
}
