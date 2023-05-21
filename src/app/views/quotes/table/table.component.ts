import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { Quote } from 'app/shared/models/quote.model';
import { QuoteService } from 'app/shared/services/apis/quotes.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/quotes/quotes.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/quotes/quotes.selectors';
import { initialState } from 'app/store/quotes/quotes.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-quotes-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class QuotesTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = [
    'id',
    'stock_no',
    'first_name',
    'last_name',
    'year',
    'make',
    'model',
    'drive_off',
    'created_at',
    'updated_at',
    'actions',
  ];

  private onDestroy$ = new Subject<void>();

  public quotes$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;

  public quotes: Array<Quote> = [];
  public meta: commonModels.Meta;
  public offset: number;

  public sortKey:string;
  public sortDirection:string;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService,
    private loader$: AppLoaderService,
    private quoteService$: QuoteService
  ) {
    this.quotes$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 1;
    this.sortKey = localStorage.getItem("quotes_module_order_by");
    this.sortDirection=localStorage.getItem("quotes_module_order_dir");
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.quotes$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(quotes => {
          if (!deepEqual(this.quotes, quotes)) {
            this.quotes = quotes;
            this.refreshTable();
          }
        })
      )
      .subscribe();

    this.meta$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(meta => {
          this.meta = meta;
          this.offset = meta.from;
          this.refreshTable();
        })
      )
      .subscribe();

    this.didFetch$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(didFetch => !didFetch && this.loadData())
      )
      .subscribe();
  }

  loadData() {
    this.store$.dispatch(new actions.GetList());
  }

  sortData(event) {
    //set arrow direction in localstorage
    localStorage.setItem("quotes_module_order_by", event.active);
    localStorage.setItem("quotes_module_order_dir", event.direction);

    const updated_filter = {
      order_by: event.active ? event.active : initialState.filter.order_by,
      order_dir: event.direction
        ? event.direction
        : initialState.filter.order_dir,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }

  // onEdit(item: Quote) {
  //   this.loader$.open();
  //   combineLatest(this.quoteService$.getById(item.id.toString()))
  //     .pipe(
  //       takeUntil(this.onDestroy$),
  //       map(result => result),
  //       catchError(err => {
  //         return of(err);
  //       })
  //     )
  //     .subscribe(([result]) => {
  //       this.loader$.close();
  //       const quoteItem = result.data;
  //       const title = 'Edit Quote';
  //       const dialogRef: MatDialogRef<any> = this.dialog.open(
  //         QuoteEditModalComponent,
  //         {
  //           width: '1024px',
  //           disableClose: false,
  //           data: { title: title, payload: quoteItem, type: 'edit' },
  //         }
  //       );
  //       dialogRef.afterClosed().subscribe(res => {
  //         if (!res) {
  //           // If user press cancel
  //           return;
  //         }

  //         this.store$.dispatch(new actions.ClearDetail());
  //       });
  //     });
  // }

  onDelete(item: Quote, index: number) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete Quote?`,
      })
      .subscribe(res => {
        if (res) {
          const payload = {
            id: item.id.toString(),
          };
          this.store$.dispatch(new actions.Delete(payload));
        }
      });
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }
}
