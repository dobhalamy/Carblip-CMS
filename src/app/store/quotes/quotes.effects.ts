import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';

import { MatSnackBar } from '@angular/material';
import { QUOTE } from 'app/core/errors';
import { formatErrorMessage } from 'app/shared/helpers/api.helper';
import * as commonModels from 'app/shared/models/common.model';
import { Quote, QuoteResponse } from 'app/shared/models/quote.model';
import { AddError } from 'app/store/error/error.actions';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { AppState } from '..';
import { QuoteService } from '../../shared/services/apis/quotes.service';
import * as actions from './quotes.actions';
import { filterSelector } from './quotes.selectors';

@Injectable()
export class QuoteEffects {
  @Effect()
  getList$: Observable<Action> = this.actions$.pipe(
    ofType(actions.GET_LIST),
    withLatestFrom(this.store$.select(filterSelector)),
    switchMap(([action, filter]) => {
      return from(this.service$.getList(filter)).pipe(
        map(result => {
          return new actions.GetListSuccess(result);
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: QUOTE.TYPE,
              message: formatErrorMessage(err, QUOTE.LIST_ERROR),
            })
          );
          return of(
            new actions.AddError({
              error: QUOTE.LIST_ERROR,
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
          this.snack$.open('Quote has been successfully Deleted!', 'OK', {
            duration: 4000,
          });
          return new actions.DeleteSuccess();
        }),
        catchError(err => {
          this.store$.dispatch(
            new AddError({
              type: QUOTE.TYPE,
              message: QUOTE.DELETE_ERROR,
            })
          );
          return of(
            new actions.AddError({
              error: QUOTE.DELETE_ERROR,
            })
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private service$: QuoteService,
    private snack$: MatSnackBar,
    private store$: Store<AppState>
  ) {}
}
