import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';

import { MatSnackBar } from '@angular/material';
import { DEALSTAGE } from 'app/core/errors';
import { formatErrorMessage } from 'app/shared/helpers/api.helper';
import * as commonModels from 'app/shared/models/common.model';
import { DealStage, DealStageResponse } from 'app/shared/models/deal.model';
import { AddError } from 'app/store/error/error.actions';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AppState } from '..';
import { DealStageService } from '../../shared/services/apis/dealstage.service';
import * as actions from './dealstage.actions';

@Injectable()
export class DealstageEffects {
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
              type: DEALSTAGE.TYPE,
              message: formatErrorMessage(err, DEALSTAGE.LIST_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: DEALSTAGE.LIST_ERROR,
            })
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private service$: DealStageService,
    private snack$: MatSnackBar,
    private store$: Store<AppState>
  ) {}
}
